<template>
  <div :id="annotation.id" ref="annotation" class="annotation">
    <span
      v-if="!publicView"
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
      required: true,
    },
    spanIndex: {
      type: Number,
      required: true,
    },
    label: {
      type: Object,
    },
    annotationSet: {
      type: Object,
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
      "getTextFromEntities",
    ]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapGetters("selection", ["isValueArray"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "annotations",
      "newAcceptedAnnotations",
      "selectedEntities",
      "showActionError",
    ]),
    annotationText() {
      if (this.isAnnotationBeingEdited) {
        if (this.selectedEntities && this.selectedEntities.length > 0) {
          return this.getTextFromEntities();
        }
        return this.$refs.contentEditable.textContent.trim();
      } else {
        return this.span.offset_string;
      }
    },
    isAnnotationDeleted() {
      return this.annotation.revised && !this.annotation.is_correct;
    },
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.annotation.id, this.spanIndex);
    },
  },
  watch: {
    span(newValue) {
      if (this.isAnnotationBeingEdited && newValue) {
        if (this.isValueArray(newValue)) {
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
    selectedEntities(newValue) {
      if (!newValue) return;

      if (
        this.editAnnotation &&
        this.annotation.id === this.editAnnotation.id
      ) {
        this.setText(this.getTextFromEntities());
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
      if (this.publicView) return;

      if (event) {
        event.preventDefault();
      }

      if (
        !this.publicView &&
        !this.isAnnotationBeingEdited &&
        !this.isLoading
      ) {
        this.$store.dispatch("selection/enableSelection", this.annotation.id);
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

      this.$store.dispatch("document/setSelectedEntities", null);
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    saveAnnotationChanges(event) {
      if (this.publicView) return;

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
