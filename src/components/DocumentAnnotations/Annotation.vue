<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="annotation" ref="annotation" :id="annotation.id">
    <span
      v-if="!publicView"
      :class="[
        'annotation-value',
        isLoading && 'saving-changes',
        error && 'error-editing',
        isAnnotationBeingEdited && 'clicked'
      ]"
      role="textbox"
      ref="contentEditable"
      :contenteditable="isAnnotationBeingEdited"
      @click="handleEditAnnotation"
      @paste="handlePaste"
      @keypress.enter="saveAnnotationChanges"
      :id="annotation.id"
    >
      {{ span.offset_string }}
    </span>
    <span v-else class="annotation-value">
      {{ span.offset_string }}
    </span>
    <div class="buttons-container">
      <ActionButtons
        :saveBtn="showButton()"
        :cancelBtn="isAnnotationBeingEdited"
        :isLoading="isLoading"
        :acceptBtn="showAcceptButton"
        @cancel="handleCancel"
        @save="saveAnnotationChanges"
        @accept="saveAnnotationChanges"
        :label="label"
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
  name: "Annotation",
  props: {
    annotation: {
      type: Object,
      required: true
    },
    span: {
      required: true
    },
    spanIndex: {
      type: Number,
      required: true
    },
    label: {
      type: Object
    },
    annotationSet: {
      type: Object
    },
    isHovered: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      error: null,
      isLoading: false,
      showAcceptButton: false
    };
  },
  components: {
    ActionButtons
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode", "pageAtIndex"]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapGetters("selection", ["isValueArray"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", ["editAnnotation", "publicView", "annotations"]),
    annotationText() {
      if (this.isAnnotationBeingEdited) {
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
    }
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
            annotationSet: this.annotationSet.id
          })
          .then(() => {
            this.$refs.contentEditable.focus();
          });

        const page = this.pageAtIndex(this.span.page_index);
        if (page) {
          const { x, y, width, height } = this.bboxToRect(page, this.span);

          const selection = {
            start: {
              x,
              y
            },
            end: {
              x: x + width,
              y: y + height
            },
            pageNumber: page.number
          };

          this.$store.dispatch("selection/setSelection", {
            selection,
            span: this.span
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

        if (
          this.annotationText.length === 0 &&
          this.isValueArray(this.annotation.span)
        ) {
          spans.splice(this.spanIndex, 1);
        } else if (
          this.spanSelection &&
          this.isValueArray(this.spanSelection)
        ) {
          if (this.spanSelection.length > 1) {
            spans = [...this.spanSelection];
          } else {
            spans[this.spanIndex] = {
              ...spans[this.spanIndex],
              offset_string: this.annotationText,
              page_index: this.spanSelection[this.spanIndex].page_index,
              x0: this.spanSelection[this.spanIndex].x0,
              x1: this.spanSelection[this.spanIndex].x1,
              y0: this.spanSelection[this.spanIndex].y0,
              y1: this.spanSelection[this.spanIndex].y1,
              start_offset: this.spanSelection[this.spanIndex].start_offset,
              end_offset: this.spanSelection[this.spanIndex].end_offset
            };
          }
        } else {
          spans[this.spanIndex] = {
            ...spans[this.spanIndex],
            offset_string: this.annotationText,
            page_index: this.spanSelection.page_index,
            x0: this.spanSelection.x0,
            x1: this.spanSelection.x1,
            y0: this.spanSelection.y0,
            y1: this.spanSelection.y1,
            start_offset: this.spanSelection.start_offset,
            end_offset: this.spanSelection.end_offset
          };
        }

        updatedString = {
          is_correct: true,
          revised: true,
          span: spans
        };
      }

      // Send to the store for the http patch/delete request
      this.$store
        .dispatch(storeAction, {
          updatedValues: updatedString,
          annotationId: this.annotation.id
        })
        .then(updatedAnnotation => {
          // Check if the response is successful or not
          if (updatedAnnotation) {
            this.showAcceptButton = false;
          }
        })
        .catch(error => {
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

          if (this.error) {
            setTimeout(() => {
              this.error = false;
            }, 2000);
          }
        });
    },
    showButton() {
      if (this.publicView) return;

      if (this.isAnnotationBeingEdited && this.spanSelection) {
        return true;
      }
      return false;
    }
  },
  watch: {
    span(newValue) {
      if (this.isAnnotationBeingEdited && newValue) {
        if (this.isValueArray(newValue)) {
          newValue.map(span => {
            if (
              span.offset_string &&
              span.offset_string !== this.span.offset_string
            )
              this.setText(span.offset_string);
          });
        } else {
          if (
            newValue.offset_string &&
            newValue.offset_string !== this.span.offset_string
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
    }
  }
};
</script>
