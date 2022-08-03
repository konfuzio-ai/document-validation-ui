<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="annotation" ref="annotation" :id="annotation.id">
    <span
      :class="[
        'label-property-value',
        !editable && 'label-empty',
        isLoading && 'saving-changes',
        error && 'error-editing'
      ]"
      role="textbox"
      ref="contentEditable"
      :contenteditable="editable"
      @paste="event => handlePaste(event, annotation)"
      @input="event => handleInput(event, annotation)"
      @keypress.enter="event => event.preventDefault()"
      @click="handleEditAnnotation(annotation)"
      @focus="onHandleEditAnnotation"
    >
      {{ getAnnotationPlaceholder(annotation.span[0].offset_string) }}
    </span>
    <div v-if="isActive && showButtons" class="buttons-container">
      <ActionButtons
        :cancelBtn="cancelBtn"
        :isActive="isActive"
        @cancel="replaceExistingAnnotation(annotation)"
      />
      <ActionButtons
        :saveBtn="saveBtn"
        :isActive="isActive"
        @save="saveAnnotationChanges(annotation)"
      />
    </div>
    <div v-if="isLoading" :class="['loading-container', isActive && 'hidden']">
      <ActionButtons :isLoading="isLoading" />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
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
    isLoading: {
      type: Boolean
    },
    handleShowError: {
      type: Function
    },
    handleMessage: {
      type: Function
    },
    onHandleEditAnnotation: {
      type: Function
    },
    onStopHandleEditAnnotation: {
      type: Function
    },
    isActive: {
      type: Boolean
    }
  },
  data() {
    return {
      oldValue: null,
      newValue: null,
      showLoading: false,
      saveBtn: true,
      cancelBtn: true,
      editable: true,
      showButtons: true,
      editing: null,
      error: null
    };
  },
  components: {
    ActionButtons
  },
  computed: {
    ...mapState("selection", [
      "selection",
      "spanSelection",
      "selectionEnabled",
      "isSelecting",
      "selectionFromBbox"
    ])
  },
  methods: {
    handleEditAnnotation(annotation) {
      this.editing = annotation.id;
      this.newValue = annotation.span[0].offset_string;

      // Get the bbox from the backend
      if (annotation.selection_bbox) {
        this.$store.dispatch(
          "selection/setSelectionFromBbox",
          annotation.selection_bbox
        );
      } else {
        this.$store.dispatch("selection/setSelectionFromBbox", null);
      }

      if (this.selectionFromBbox) {
        annotation.selection_bbox = this.selectionFromBbox;
      }

      this.$emit("handle-data-changes", {
        annotation: null,
        isLoading: null
      });
    },
    replaceExistingAnnotation(annotation) {
      // set ann value to be empty
      this.newValue = "";

      // Show bbox to select new text
      this.$store.dispatch("selection/enableSelection", annotation.id);
    },
    getAnnotationPlaceholder(annotationString) {
      if (!this.isActive) {
        return annotationString;
      } else {
        if (this.newValue === "") {
          // prevent contenteditable from being edited
          this.editable = false;
          return this.$t("draw_box_document");
        } else {
          return annotationString;
        }
      }
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    handleInput(event, annotation) {
      this.oldValue = annotation.span[0].offset_string;
      this.newValue = event.target.textContent.trim();

      if (event.target.textContent === "") {
        this.newValue = "";
        this.replaceExistingAnnotation(annotation);
      }

      this.$emit("handle-data-changes", {
        annotation,
        isLoading: null
      });
    },
    saveAnnotationChanges(annotation) {
      this.onStopHandleEditAnnotation();
      const spanArray = annotation.span[0];
      const id = annotation.id;
      let updatedString;

      // If the user didn't change the value, we don't want to do anything
      if (this.newValue === this.oldValue) {
        this.$emit("handle-data-changes", {
          annotation: null,
          isLoading: null
        });
        return;
      }

      this.$emit("handle-data-changes", {
        annotation: null,
        isLoading: true
      });

      if (this.newValue.length === 0) {
        updatedString = {
          is_correct: false,
          revised: true
        };
      } else {
        updatedString = {
          span: [
            {
              offset_string: this.newValue,
              bottom: spanArray.bottom,
              top: spanArray.top,
              page_index: spanArray.page_index,
              x0: spanArray.x0,
              x1: spanArray.x1,
              y0: spanArray.y0,
              y1: spanArray.y1,
              start_offset: spanArray.start_offset,
              end_offset: spanArray.end_offset
            }
          ]
        };
      }

      this.$store.dispatch("document/startLoading");
      this.showButtons = false;

      // Send to the store for the http patch request
      this.$store
        .dispatch("document/updateAnnotation", {
          updatedValues: updatedString,
          annotationId: id
        })
        .then(response => {
          // Check if the response is successfull or not
          if (response) {
            this.oldValue = this.newValue;
            this.$store.dispatch("document/fetchAnnotations");
            this.$emit("handle-data-changes", {
              annotation: null,
              isLoading: null
            });
          } else {
            this.$refs.contentEditable.textContent = this.oldValue;
            this.newValue = this.oldValue;

            this.error = true;
            this.handleShowError();
            this.handleMessage(this.$i18n.t("editing_error"));

            this.$emit("handle-data-changes", {
              annotation: null,
              isLoading: null
            });
          }
        })
        .finally(() => {
          this.$store.dispatch("document/endLoading");
          this.$store.dispatch("selection/disableSelection");
          this.$emit("handle-data-changes", {
            annotation: null,
            isLoading: false
          });

          setTimeout(() => {
            this.error = false;
          }, 2000);

          this.showButtons = true;
          this.editing = null;
        });
    }
  },
  watch: {
    spanSelection(newValue) {
      // if no span selection, do nothing
      if (!newValue) {
        return;
      }

      // Else check we only add the bbox content to the annotation being edited
      if (this.isActive && !this.editable) {
        this.$refs.contentEditable.textContent = newValue.offset_string;
        this.newValue = newValue.offset_string;
        this.editable = true;
      }
    },
    newValue(newValue) {
      this.getAnnotationPlaceholder(newValue);
    }
  }
};
</script>
