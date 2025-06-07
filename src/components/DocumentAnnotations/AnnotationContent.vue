<template>
  <div :id="annotation.id" ref="annotation" class="annotation">
    <span
      :id="annotation.id"
      ref="contentEditable"
      :class="[
        'annotation-value',
        'keyboard-nav',
        isLoading && 'saving-changes',
        showActionError &&
          editAnnotation &&
          editAnnotation.id === annotation.id &&
          'error-editing',
        isSpanBeingEdited && 'clicked-ann',
      ]"
      role="textbox"
      :contenteditable="isSpanBeingEdited"
      @click="handleEditAnnotation"
      @paste="handlePaste"
      @keypress.enter="saveAnnotationChanges"
    >
      {{ span.offset_string }}
    </span>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import { isElementArray } from "../../utils/utils";

/**
 * This component is responsible for managing filled annotations.
 */
export default {
  name: "AnnotationContent",
  props: {
    annotation: {
      type: Object,
      required: true,
    },
    span: {
      type: [Object, Array],
      required: true,
    },
    spanIndex: {
      type: Number,
      required: true,
    },
    label: {
      type: Object,
      required: true,
    },
    annotationSet: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isLoading: false,
    };
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode", "isDocumentReviewed"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "annotations",
      "newAcceptedAnnotations",
      "showActionError",
    ]),
    isSpanBeingEdited() {
      return this.isAnnotationInEditMode(this.annotation.id, this.spanIndex);
    },
    isAnnotationBeingEdited() {
      return (
        this.editAnnotation && this.annotation.id === this.editAnnotation.id
      );
    },
  },

  watch: {
    span() {
      // span content changed, ex. from click on entity
      this.setText(this.span.offset_string);
    },
  },

  methods: {
    setText(text) {
      this.$refs.contentEditable.textContent = text;
    },
    getAnnotationText() {
      return this.$refs.contentEditable.textContent.trim();
    },
    handleEditAnnotation(event) {
      if (this.publicView || this.isDocumentReviewed) return;

      if (event) {
        event.preventDefault();
      }

      if (
        !this.publicView &&
        !this.isDocumentReviewed &&
        !this.isSpanBeingEdited &&
        !this.isLoading
      ) {
        if (!this.isAnnotationBeingEdited) {
          this.$store.dispatch(
            "selection/setSpanSelection",
            this.annotation.span
          );
        }

        this.$store
          .dispatch("document/setEditAnnotation", {
            id: this.annotation.id,
            index: this.spanIndex,
            label: this.label,
            labelSet: this.annotationSet.label_set,
            annotationSet: this.annotationSet,
            pageNumber: this.span.page_index + 1,
          })
          .then(() => {
            if (this.$refs.contentEditable) {
              this.$refs.contentEditable.focus();
            }
          })
          .catch((error) => {
            console.log(error);
          });
        // check if this is part of a group of spans to show the whole bounding box as a placeholder
        if (this.annotation.selection_bbox && this.annotation.span.length > 1) {
          this.$store.dispatch("selection/setPlaceholderSelection", [
            this.annotation.selection_bbox,
          ]);
        }
      }
    },
    handleCancel() {
      this.setText(this.span.offset_string);
      this.isLoading = false;
      if (this.$refs.contentEditable) {
        this.$refs.contentEditable.blur();
      }

      this.$store.dispatch("selection/setSpanSelection", null);
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    saveAnnotationChanges(event) {
      if (this.publicView || this.isDocumentReviewed) return;

      if (event) {
        event.preventDefault();
      }

      // Validate if we are declining an Annotation that is not multi-lined
      // by deleting the content instead of clicking the 'decline' button
      let isToDecline =
        this.getAnnotationText().length === 0 &&
        (!isElementArray(this.annotation.span) ||
          this.annotation.span.length === 1);

      // API call handled in parent component - AnnotationRow
      this.$emit("save-annotation-changes", isToDecline);
    },
    createSpan() {
      const annotationText = this.getAnnotationText();
      if (!annotationText) return;

      return {
        offset_string: annotationText,
        page_index: this.span.page_index,
        x0: this.span.x0,
        x1: this.span.x1,
        y0: this.span.y0,
        y1: this.span.y1,
        start_offset: this.span.start_offset,
        end_offset: this.span.end_offset,
        is_custom: this.span.offset_string !== annotationText,
      };
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
