<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div
    class="empty-annotation"
    @mouseenter="handleShowReject"
    @mouseleave="showReject = false"
  >
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
      @input="isEmpty"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
      :id="emptyAnnotationId()"
    >
      {{ $t("no_data_found") }}
    </span>

    <ActionButtons
      :saveBtn="!empty && isEmptyAnnotationEditable()"
      :cancelBtn="isAnnotationBeingEdited()"
      :showReject="showReject"
      :isLoading="isLoading"
      :isActive="!isLoading"
      @save="saveEmptyAnnotation"
      @cancel="cancelEmptyAnnotation"
    />
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import ActionButtons from "./ActionButtons";
/**
 * This component is responsible for managing empty annotations.
 */
export default {
  name: "EmptyAnnotation",
  data() {
    return {
      empty: false,
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
    }
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", [
      "editAnnotation",
      "editingActive",
      "publicView",
      "documentId",
      "rejectAnnotation"
    ])
  },
  methods: {
    isEmpty() {
      this.empty =
        this.$refs.emptyAnnotation &&
        this.$refs.emptyAnnotation.textContent.trim() === "";
    },
    emptyAnnotationId() {
      if (!this.annotationSet || !this.label) return;

      return `${this.annotationSet.label_set.id}_${this.label.id}`;
    },
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.emptyAnnotationId());
    },
    handleEditEmptyAnnotation() {
      if (
        !this.publicView &&
        !this.isLoading &&
        this.selectionEnabled !== this.emptyAnnotationId()
      ) {
        this.setText(this.$t("draw_box_document"));
        this.$store.dispatch(
          "selection/enableSelection",
          this.emptyAnnotationId()
        );
        this.$store.dispatch("document/setEditAnnotation", {
          id: this.emptyAnnotationId(),
          label: this.label.id,
          labelSet: this.annotationSet.label_set.id
        });
        this.$store.dispatch("document/setEditingActive", true);
      }
    },
    saveEmptyAnnotation(event) {
      if (event) {
        event.preventDefault();
      }
      // update the bbox text with the one from the input
      this.spanSelection.offset_string = this.$refs.emptyAnnotation.textContent;
      this.spanSelection.offset_string_original =
        this.$refs.emptyAnnotation.textContent;

      const annotationToCreate = {
        document: this.documentId,
        span: [this.spanSelection],
        label: this.label.id,
        label_set: this.annotationSet.label_set.id,
        is_correct: true,
        revised: true
      };
      this.isLoading = true;
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          if (annotationCreated) {
            this.$emit("handle-data-changes", {
              annotation: annotationCreated
            });
          } else {
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
    cancelEmptyAnnotation() {
      this.isLoading = false;
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("document/setEditingActive", false);
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
      this.$refs.emptyAnnotation.textContent = text;
    },
    handleShowReject() {
      if (!this.isAnnotationBeingEdited()) {
        this.showReject = true;
      }
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
      if (
        oldAnnotation &&
        newAnnotation &&
        oldAnnotation.id === this.emptyAnnotationId() &&
        oldAnnotation.id !== newAnnotation.id
      ) {
        this.$refs.emptyAnnotation.blur();
        this.setText(this.$t("no_data_found"));
      }
    },
    editingActive(newValue) {
      if (!newValue) {
        this.cancelEmptyAnnotation();
      }
    },
    rejectAnnotation(newValue) {
      if (
        newValue &&
        newValue.label === this.label.id &&
        newValue.label_set === this.annotationSet.label_set.id
      ) {
        this.isLoading = true;
      } else {
        this.isLoading = false;
      }
    }
  }
};
</script>
