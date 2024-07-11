<template>
  <div :id="annotation.id" ref="annotation" class="annotation">
    <b-checkbox
      v-if="annotation.metadata && annotation.metadata.checkbox"
      class="annotation-checkbox"
      :native-value="isChecked"
      @input="handleCheckboxChanged"
    />
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
        isAnnotationBeingEdited && 'clicked-ann',
      ]"
      role="textbox"
      :contenteditable="isAnnotationBeingEdited"
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
      isChecked: false, //this.annotation.metadata.omr.is_checked,
    };
  },
  computed: {
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "pageAtIndex",
      "isDocumentReviewed",
    ]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "annotations",
      "newAcceptedAnnotations",
      "showActionError",
    ]),
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.annotation.id, this.spanIndex);
    },
  },

  watch: {
    isAnnotationBeingEdited(newState, oldState) {
      // verify if new annotation in edit mode is not this one and if this
      // one was selected before so we set the state to the previous one (like a cancel)
      if (!newState && oldState) {
        this.handleCancel();
      }
    },
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
    handleCheckboxChanged(value) {
      this.$store
        .dispatch("document/updateAnnotation", {
          updatedValues: {
            metadata: {
              checkbox: {
                is_checked: value,
              },
            },
          },
          annotationId: this.annotation.id,
          annotationSet: this.annotationSet,
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        });
    },
    handleEditAnnotation(event) {
      if (this.publicView || this.isDocumentReviewed) return;

      if (event) {
        event.preventDefault();
      }

      if (
        !this.publicView &&
        !this.isDocumentReviewed &&
        !this.isAnnotationBeingEdited &&
        !this.isLoading
      ) {
        this.$store.dispatch("selection/selectElement", this.annotation.id);

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
            this.$refs.contentEditable.focus();
          })
          .catch((error) => {
            console.log(error);
          });

        const page = this.pageAtIndex(this.span.page_index);
        if (page) {
          const { x, y, width, height } = this.bboxToRect(page, this.span);

          const selection = {
            start: {
              x,
              y,
            },
            end: {
              x: x + width,
              y: y + height,
            },
            pageNumber: page.number,
            custom: false,
          };

          this.$store.dispatch("selection/setSelection", {
            selection,
            span: this.span,
          });
        }
      }
    },
    handleCancel() {
      this.setText(this.span.offset_string);
      this.isLoading = false;
      if (this.$refs.contentEditable) {
        this.$refs.contentEditable.blur();
      }

      this.$store.dispatch("selection/setSelectedEntities", null);
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
