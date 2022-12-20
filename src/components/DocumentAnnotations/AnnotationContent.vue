<template>
  <div
    :id="annotation.id"
    ref="annotation"
    class="annotation"
  >
    <span
      v-if="!publicView"
      :id="annotation.id"
      ref="contentEditable"
      :class="[
        'annotation-value',
        isLoading && 'saving-changes',
        error && 'error-editing',
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
    <span
      v-else
      class="annotation-value"
    >
      {{ span.offset_string }}
    </span>
    <div class="buttons-container">
      <ActionButtons
        :save-btn="showButton()"
        :cancel-btn="isAnnotationBeingEdited"
        :is-loading="isLoading"
        :accept-btn="showAcceptButton"
        :label="label"
        @cancel="handleCancel"
        @save="saveAnnotationChanges"
        @accept="saveAnnotationChanges"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import ActionButtons from "./ActionButtons";
/**
 * This component is responsible for managing filled annotations.
 */
export default {
  name: "AnnotationContent",
  components: {
    ActionButtons,
  },
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
    isHovered: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      error: null,
      isLoading: false,
      showAcceptButton: false,
    };
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode", "pageAtIndex"]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapGetters("selection", ["isValueArray"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "annotations",
      "newAcceptedAnnotations",
      "selectedEntity",
    ]),
    annotationText() {
      if (this.isAnnotationBeingEdited) {
        if (this.selectedEntity) {
          return this.selectedEntity.offset_string;
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
    isHovered(newValue) {
      if (this.publicView) return;
      this.showAcceptButton = newValue && !this.annotation.revised;
    },
    newAcceptedAnnotations(newValue) {
      if (!newValue) {
        this.isLoading = false;
        return;
      }

      this.enableLoading(newValue);
    },
    selectedEntity(newValue) {
      if (!newValue) return;

      if (this.annotation.id === this.editAnnotation.id) {
        this.setText(newValue.offset_string);
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
        this.$store.dispatch("document/resetEditAnnotation");
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("document/endLoading");
      }

      this.isLoading = false;
      if (this.$refs.contentEditable) {
        this.$refs.contentEditable.blur();
      }

      this.$store.dispatch("document/setSelectedEntity", null);
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

      let updatedString;

      this.isLoading = true;

      // Check if we are deleting a single annotation that it's not multi-lined
      let isToDelete =
        this.annotationText.length === 0 &&
        (!this.isValueArray(this.annotation.span) ||
          this.annotation.span.length === 1);

      let storeAction;

      if (isToDelete) {
        storeAction = "document/deleteAnnotation";
      } else {
        storeAction = "document/updateAnnotation";

        let spans = [...this.annotation.span];

        // Validations to consider span as an array (multiline annotations) or object
        if (
          this.annotationText.length === 0 &&
          this.isValueArray(this.annotation.span)
        ) {
          // if the annotation content in one row was deleted
          // check if it it part of an array
          // to only remove that string
          spans.splice(this.spanIndex, 1);
        } else if (
          this.spanSelection &&
          this.isValueArray(this.spanSelection)
        ) {
          let span;

          // Check if editing was from selecting an entity
          if (this.selectedEntity) {
            span = this.selectedEntity;
          } else {
            spans = [...this.spanSelection];
            span = this.createSpan(this.spanSelection[this.spanIndex]);
          }

          // span is array, only update current one
          spans[this.spanIndex] = {
            ...spans[this.spanIndex],
            span,
          };
        } else {
          // if span is NOT an array, but an object
          let span;

          if (this.selectedEntity) {
            spans[this.spanIndex] = { ...this.selectedEntity };
          } else if (this.spanSelection) {
            span = this.createSpan(this.spanSelection);

            spans[this.spanIndex] = {
              ...spans[this.spanIndex],
              ...span,
            };
          } else {
            span = this.createSpan(this.span);

            spans[this.spanIndex] = {
              ...spans[this.spanIndex],
              ...span,
            };
          }
        }

        updatedString = {
          is_correct: true,
          revised: true,
          span: spans,
        };
      }

      // Send to the store for the http patch/delete request
      this.$store
        .dispatch(storeAction, {
          updatedValues: updatedString,
          annotationId: this.annotation.id,
        })
        .then((updatedAnnotation) => {
          // Check if the response is successful or not
          if (updatedAnnotation) {
            this.showAcceptButton = false;
          }
        })
        .catch((error) => {
          if (error) {
            this.$store.dispatch("document/setErrorMessage", error);
          } else {
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("editing_error")
            );
          }
        })
        .finally(() => {
          this.handleCancel();
        });
    },
    createSpan(span) {
      return {
        offset_string: this.annotationText,
        page_index: span.page_index,
        x0: span.x0,
        x1: span.x1,
        y0: span.y0,
        y1: span.y1,
        start_offset: span.start_offset,
        end_offset: span.end_offset,
      };
    },
    showButton() {
      if (this.publicView) return;

      if (this.isAnnotationBeingEdited && this.spanSelection) {
        return true;
      }
      return false;
    },
    enableLoading(annotations) {
      if (annotations) {
        const found = annotations.ids.find(
          (annotation) => annotation === this.annotation.id
        );

        if (found) {
          this.isLoading = true;
        }
      } else {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>