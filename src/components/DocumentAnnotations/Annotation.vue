<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div
    class="annotation"
    ref="annotation"
    :id="annotation.id"
    @mouseenter="showAcceptButton = true"
    @mouseleave="showAcceptButton = false"
  >
    <span
      v-if="!publicView"
      :class="[
        'annotation-value',
        isLoading && 'saving-changes',
        error && 'error-editing',
        isAnnotationDeleted && !isAnnotationEditable() ? 'label-empty' : '',
        isAnnotationBeingEdited && 'clicked'
      ]"
      role="textbox"
      ref="contentEditable"
      :contenteditable="isAnnotationEditable()"
      @click="handleEditAnnotation"
      @paste="handlePaste"
      @keypress.enter="saveAnnotationChanges"
    >
      {{ isAnnotationDeleted ? $t("no_data_found") : this.span.offset_string }}
    </span>
    <span v-else class="annotation-value">
      {{ isAnnotationDeleted ? "" : this.span.offset_string }}
    </span>
    <div class="buttons-container">
      <ActionButtons
        :saveBtn="showButton()"
        :cancelBtn="isAnnotationBeingEdited"
        :isActive="!isLoading"
        :isLoading="isLoading"
        :menu="!isAnnotationBeingEdited"
        :acceptBtn="showAcceptButton"
        @cancel="handleCancel"
        @save="saveAnnotationChanges"
        @accept="saveAnnotationChanges"
        :annotationSet="annotationSet"
        :label="label"
        :handleMenu="handleMenu"
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
      type: Object,
      required: true
    },
    spanIndex: {
      type: Number,
      required: true
    },
    handleMenu: {
      type: Function
    },
    label: {
      type: Object
    },
    annotationSet: {
      type: Object
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
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", [
      "editAnnotation",
      "editingActive",
      "publicView",
      "acceptAnnotation"
    ]),
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
    isAnnotationEditable() {
      return (
        !this.publicView &&
        (!this.isAnnotationDeleted ||
          (this.isAnnotationBeingEdited &&
            this.spanSelection &&
            this.spanSelection.offset_string != null))
      );
    },
    setText(text) {
      this.$refs.contentEditable.textContent = text;
    },
    handleEditAnnotation(event) {
      if (event) {
        event.preventDefault();
      }

      if (
        !this.publicView &&
        !this.isAnnotationBeingEdited &&
        !this.isLoading
      ) {
        this.$store.dispatch("selection/enableSelection", this.annotation.id);
        this.$store.dispatch("document/setEditAnnotation", {
          id: this.annotation.id,
          index: this.spanIndex
        });
        this.$store.dispatch("document/setEditingActive", true);

        if (this.isAnnotationDeleted) {
          this.setText(this.$t("draw_box_document"));
        } else {
          this.$refs.contentEditable.focus();

          const page = this.pageAtIndex(this.span.page_index);
          if (page) {
            // this.$store.dispatch("selection/enableSelection", this.annotation.id);
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
      }
    },
    handleCancel() {
      this.setText(
        this.isAnnotationDeleted
          ? this.$t("no_data_found")
          : this.span.offset_string
      );
      this.$store.dispatch("document/resetEditAnnotation", null);
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("document/setEditingActive", false);
      this.$store.dispatch("document/setAcceptAnnotation", false);
      this.$refs.contentEditable.blur();
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    saveAnnotationChanges(event) {
      if (event) {
        event.preventDefault();
      }

      let updatedString;

      this.isLoading = true;
      this.$store.dispatch("document/startLoading");

      let storeAction;

      if (this.showAcceptButton || this.saveAnnotationChanges) {
        storeAction = "document/updateAnnotation";

        updatedString = {
          is_correct: true,
          revised: true
        };
      } else if (this.annotationText.length === 0) {
        storeAction = "document/deleteAnnotation";
      } else {
        storeAction = "document/updateAnnotation";
        const spans = this.annotation.span;
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
        updatedString = {
          is_correct: true,
          span: spans
        };
      }

      // Send to the store for the http patch/delete request
      this.$store
        .dispatch(storeAction, {
          updatedValues: updatedString,
          annotationId: this.annotation.id
        })
        .then(response => {
          // Check if the response is successful or not
          if (response) {
            this.$store.dispatch("document/fetchAnnotations");
            this.isLoading = false;
          } else {
            this.error = true;
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("editing_error")
            );
            this.setText(
              this.isAnnotationDeleted
                ? this.$t("no_data_found")
                : this.span.offset_string
            );
          }
        })
        .finally(() => {
          this.$store.dispatch("document/resetEditAnnotation");
          this.$store.dispatch("document/endLoading");
          this.$store.dispatch("selection/disableSelection");
          this.$store.dispatch("document/setAcceptAnnotation", false);
          this.isLoading = false;

          this.$refs.contentEditable.blur();

          setTimeout(() => {
            this.error = false;
          }, 2000);
        });
    },
    showButton() {
      if (this.isAnnotationBeingEdited && this.spanSelection) {
        return true;
      }
      return false;
    }
  },
  watch: {
    spanSelection(span) {
      if (
        this.isAnnotationBeingEdited &&
        span &&
        span.offset_string &&
        span.offset_string !== this.span.offset_string
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
        oldAnnotation.id === this.annotation.id &&
        oldAnnotation.index === this.spanIndex &&
        (oldAnnotation.id !== newAnnotation.id ||
          oldAnnotation.index !== newAnnotation.index)
      ) {
        this.setText(
          this.isAnnotationDeleted
            ? this.$t("no_data_found")
            : this.span.offset_string
        );
        this.$refs.contentEditable.blur();
      }
    },
    editingActive(newValue) {
      if (!newValue) {
        this.handleCancel();
      }
    },
    acceptAnnotation(newValue) {
      if (newValue) {
        this.saveAnnotationChanges();
      }
    }
  }
};
</script>
