<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="empty-annotation">
    <span
      v-if="!publicView"
      :class="[
        'annotation-value',
        error && 'error-editing',
        isEmptyAnnotationEditable() ? '' : 'label-empty',
        isAnnotationBeingEdited() && 'clicked'
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @keypress.enter="saveEmptyAnnotation"
      ref="emptyAnnotation"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
      :id="emptyAnnotationId()"
    >
      {{ $t("no_data_found") }}
    </span>

    <ActionButtons
      :saveBtn="isEmptyAnnotationEditable()"
      :cancelBtn="isAnnotationBeingEdited()"
      :showReject="showReject"
      :isLoading="isLoading"
      @save="saveEmptyAnnotation"
      @cancel="cancelEmptyAnnotation"
    />
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import ActionButtons from "./ActionButtons";
/**
 * This component is responsible for managing empty annotations (labels with no annotations).
 */
export default {
  name: "EmptyAnnotation",
  data() {
    return {
      isLoading: false,
      error: false,
      showReject: false
    };
  },
  components: { ActionButtons },
  props: {
    label: {
      required: true
    },
    annotationSet: {
      required: true
    },
    isHovered: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "documentId",
      "rejectedMissingAnnotations",
      "annotationSets"
    ])
  },
  methods: {
    emptyAnnotationId() {
      if (!this.annotationSet || !this.label) return;

      if (this.annotationSet.id) {
        return `${this.annotationSet.id}_${this.label.id}`;
      } else {
        return `${this.annotationSet.label_set.id}_${this.label.id}`;
      }
    },
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.emptyAnnotationId());
    },
    handleEditEmptyAnnotation() {
      if (this.publicView) return;

      if (
        !this.publicView &&
        !this.isLoading &&
        this.selectionEnabled !== this.emptyAnnotationId()
      ) {
        this.setText(
          this.$t("draw_box_document", { label_name: this.label.name })
        );
        this.$store.dispatch(
          "selection/enableSelection",
          this.emptyAnnotationId()
        );
        this.$store.dispatch("document/setEditAnnotation", {
          id: this.emptyAnnotationId(),
          label: this.label.id,
          labelSet: this.annotationSet.label_set.id
        });
      }
    },
    saveEmptyAnnotation(event) {
      if (this.publicView) return;

      if (event) {
        event.preventDefault();
      }
      // update the bbox text with the one from the input
      this.spanSelection.offset_string = this.$refs.emptyAnnotation.innerHTML;
      this.spanSelection.offset_string_original =
        this.$refs.emptyAnnotation.innerHTML;

      let annotationToCreate;

      if (this.annotationSet.id) {
        annotationToCreate = {
          document: this.documentId,
          span: [this.spanSelection],
          label: this.label.id,
          annotation_set: this.annotationSet.id,
          is_correct: true,
          revised: true
        };
      } else {
        // if annotation set id is null
        annotationToCreate = {
          document: this.documentId,
          span: [this.spanSelection],
          label: this.label.id,
          label_set: this.annotationSet.label_set.id,
          is_correct: true,
          revised: true
        };
      }

      this.isLoading = true;
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          if (!annotationCreated) {
            this.error = true;
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("editing_error")
            );
          }
        })
        .finally(() => {
          this.cancelEmptyAnnotation();
          setTimeout(() => {
            this.error = false;
          }, 2000);
        });
    },
    cancelEmptyAnnotation(wasOutsideClick = false) {
      if (wasOutsideClick) {
        this.setText(this.$t("no_data_found"));
      } else {
        this.$store.dispatch("document/resetEditAnnotation");
        this.$store.dispatch("selection/disableSelection");
      }
      this.isLoading = false;

      if (this.$refs.emptyAnnotation) {
        this.$refs.emptyAnnotation.blur();
      }
    },
    isEmptyAnnotationEditable() {
      return (
        this.selectionEnabled === this.emptyAnnotationId() &&
        this.spanSelection &&
        this.spanSelection.offset_string != null &&
        !this.isLoading
      );
    },
    showActionButtons() {
      return (
        this.selectionEnabled === this.emptyAnnotationId() || this.isLoading
      );
    },
    setText(text) {
      this.$refs.emptyAnnotation.innerHTML = text;
    }
  },
  watch: {
    spanSelection(span) {
      if (
        this.selectionEnabled === this.emptyAnnotationId() &&
        span &&
        span.offset_string
      ) {
        this.setText(span.offset_string);
      }
    },
    editAnnotation(newAnnotation, oldAnnotation) {
      // verify if new annotation in edit mode is not this one and if this
      // one was selected before so we set the state to the previous one (like a cancel)
      if (oldAnnotation && oldAnnotation.id === this.emptyAnnotationId()) {
        this.cancelEmptyAnnotation(true);
      }
    },
    rejectedMissingAnnotations(newValue) {
      if (
        newValue &&
        newValue.label === this.label.id &&
        newValue.label_set === this.annotationSet.label_set.id
      ) {
        this.isLoading = true;
      } else {
        this.isLoading = false;
      }
    },
    isHovered(newValue) {
      if (this.publicView) return;
      this.showReject = newValue && !this.isAnnotationBeingEdited();
    }
  }
};
</script>
