<template>
  <div :id="annotation.id" ref="annotation" class="annotation">
    <span
      v-if="!publicView || !isDocumentReviewed"
      :id="annotation.id"
      ref="contentEditable"
      :class="[
        'annotation-value',
        isLoading && 'saving-changes',
        showActionError &&
          editAnnotation &&
          editAnnotation.id === annotation.id &&
          'error-editing',
        isAnnotationBeingEdited && 'clicked',
      ]"
      role="textbox"
      :contenteditable="isAnnotationBeingEdited"
      @click="handleEditAnnotation"
      @paste="handlePaste"
      @keypress.enter="saveAnnotationChanges"
    >
      {{ span.offset_string }}
    </span>
    <span v-else class="annotation-value">
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
    saveChanges: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      isLoading: false,
    };
  },
  computed: {
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "pageAtIndex",
      "isDocumentReviewed",
    ]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapState("selection", ["spanSelection"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "annotations",
      "newAcceptedAnnotations",
      "showActionError",
    ]),

    isAnnotationDeleted() {
      return this.annotation.revised && !this.annotation.is_correct;
    },
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.annotation.id, this.spanIndex);
    },
    annotationText() {
      if (this.isAnnotationBeingEdited) {
        return this.$refs.contentEditable.textContent.trim();
      } else {
        return this.span.offset_string;
      }
    },
  },
  watch: {
    span(newValue) {
      if (this.isAnnotationBeingEdited && newValue) {
        if (isElementArray(newValue)) {
          newValue.map((span) => {
            if (
              span.offset_string &&
              span.offset_string !== this.span.offset_string
            )
              this.setText(span.offset_string);
          });
        } else {
          if (
            (newValue.offset_string &&
              newValue.offset_string !== this.span.offset_string) ||
            newValue.offset_string !==
              this.$refs.contentEditable.textContent.trim()
          )
            this.setText(newValue.offset_string);
        }
      }
    },
    editAnnotation(newAnnotation, oldAnnotation) {
      // verify if new annotation in edit mode is not this one and if this
      // one was selected before so we set the state to the previous one (like a cancel)

      if (
        oldAnnotation &&
        oldAnnotation.id === this.annotation.id &&
        oldAnnotation.index === this.spanIndex
      ) {
        this.handleCancel(true);
      }
    },

    saveChanges(newValue) {
      if (newValue) {
        this.saveAnnotationChanges();
      }
    },
  },
  methods: {
    setText(text) {
      this.$refs.contentEditable.textContent = text;
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
            label: this.label.id,
            labelSet: this.annotationSet.label_set.id,
            annotationSet: this.annotationSet.id,
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
    handleCancel(wasOutsideClick = false) {
      if (wasOutsideClick) {
        this.setText(this.span.offset_string);
      } else {
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("document/endLoading");
      }

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

      // API call handled in parent component - AnnotationRow
      this.$emit(
        "save-annotation-changes",
        this.annotation,
        this.spanIndex,
        this.span,
        this.annotationText
      );
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
