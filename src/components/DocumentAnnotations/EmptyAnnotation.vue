<template>
  <div class="empty-annotation">
    <span
      v-if="!publicView"
      :id="emptyAnnotationId()"
      ref="emptyAnnotation"
      :class="[
        'annotation-value',
        showActionError && 'error-editing',
        isEmptyAnnotationEditable() ? '' : 'label-empty',
        isAnnotationBeingEdited() && 'clicked',
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @keypress.enter="saveEmptyAnnotation"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
    >
      <span v-if="span && span.offset_string && isEmptyAnnotationEditable()">
        {{ span.offset_string }}
      </span>
      <span v-else>
        {{ $t("no_data_found") }}
      </span>
    </span>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";

/**
 * This component is responsible for managing empty annotations (labels with no annotations).
 */
export default {
  name: "EmptyAnnotation",
  components: {
    // ActionButtons
  },
  props: {
    label: {
      required: true,
    },
    annotationSet: {
      required: true,
    },

    span: {
      required: false,
    },
    spanIndex: {
      required: false,
    },
    saveChanges: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      isLoading: false,
      showReject: false,
    };
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode"]),
    ...mapGetters("selection", ["isValueArray"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "documentId",
      "annotationSets",
      "selectedEntity",
      "showActionError",
    ]),
  },
  watch: {
    span(newValue) {
      if (this.selectionEnabled === this.emptyAnnotationId() && newValue) {
        if (this.isValueArray(newValue))
          newValue.map((span) => {
            if (span.offset_string) {
              span.offset_string =
                this.$refs.emptyAnnotation.textContent.trim();
              span.offset_string_original =
                this.$refs.emptyAnnotation.textContent.trim();

              this.setText(span.offset_string);
            }
          });
      }
    },
    editAnnotation(newAnnotation, oldAnnotation) {
      // verify if new annotation in edit mode is not this one and if this
      // one was selected before so we set the state to the previous one (like a cancel)
      if (oldAnnotation && oldAnnotation.id === this.emptyAnnotationId()) {
        this.cancelEmptyAnnotation(true);
      }
    },
    selectedEntity(newValue) {
      if (!newValue) return;

      if (this.emptyAnnotationId() === this.editAnnotation.id) {
        this.setText(newValue.offset_string);
      }
    },
    saveChanges(newValue) {
      if (newValue && this.isAnnotationInEditMode(this.emptyAnnotationId())) {
        this.saveEmptyAnnotation();
      }
    },
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
          index: null,
          label: this.label.id,
          labelSet: this.annotationSet.label_set.id,
          annotationSet: this.annotationSet.id,
        });
      }
    },
    saveEmptyAnnotation(event) {
      if (this.publicView) return;

      if (event) {
        event.preventDefault();
      }
      // update the bbox text with the one from the input

      let annotationToCreate;
      let span;

      if (this.selectedEntity) {
        span = [this.selectedEntity];
      } else {
        span = this.spanSelection;
      }

      if (this.annotationSet.id) {
        annotationToCreate = {
          document: this.documentId,
          span: span,
          label: this.label.id,
          annotation_set: this.annotationSet.id,
          is_correct: true,
          revised: true,
        };
      } else {
        // if annotation set id is null
        annotationToCreate = {
          document: this.documentId,
          span: span,
          label: this.label.id,
          label_set: this.annotationSet.label_set.id,
          is_correct: true,
          revised: true,
        };
      }

      this.isLoading = true;
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then((response) => {
          if (response && response.data) {
            if (response.data.length > 0) {
              this.$store.dispatch(
                "document/setErrorMessage",
                response.data[0]
              );
            } else {
              this.$store.dispatch(
                "document/setErrorMessage",
                this.$t("editing_error")
              );
            }
          }
        })
        .finally(() => {
          this.cancelEmptyAnnotation();
        });
    },
    cancelEmptyAnnotation(wasOutsideClick = false) {
      if (wasOutsideClick) {
        this.setText(this.$t("no_data_found"));
      } else {
        this.$store.dispatch("selection/disableSelection");
      }
      this.isLoading = false;

      if (this.$refs.emptyAnnotation) {
        this.$refs.emptyAnnotation.blur();
      }

      this.$store.dispatch("document/setSelectedEntity", null);
    },
    isEmptyAnnotationEditable() {
      if (this.selectedEntity) {
        return (
          this.selectionEnabled === this.emptyAnnotationId() && !this.isLoading
        );
      } else if (
        this.spanSelection &&
        this.spanSelection[this.spanIndex] === 0
      ) {
        return false;
      } else {
        return (
          this.selectionEnabled === this.emptyAnnotationId() &&
          this.spanSelection &&
          this.spanSelection[this.spanIndex] &&
          this.spanSelection[this.spanIndex].offset_string != null &&
          !this.isLoading
        );
      }
    },
    setText(text) {
      this.$refs.emptyAnnotation.innerHTML = text;
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
