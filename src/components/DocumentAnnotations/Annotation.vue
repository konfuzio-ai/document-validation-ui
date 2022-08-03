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
        !notEditing &&
          isLoading &&
          isAnnotationBeingEditedNull() === annotation.id &&
          'saving-changes',
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
        :annotationClicked="annotationClicked.clicked"
        @cancel="replaceExistingAnnotation(annotation)"
      />
      <ActionButtons
        :saveBtn="saveBtn"
        :annotationClicked="annotationClicked.clicked"
        @save="saveAnnotationChanges(annotation)"
      />
    </div>
    <div
      v-if="isLoading"
      :class="[
        'loading-container',
        annotation.id !== annBeingEdited.id && 'hidden'
      ]"
    >
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
    annotationClicked: {
      type: Object
    },
    isLoading: {
      type: Boolean
    },
    notEditing: {
      type: Boolean
    },
    annBeingEdited: {
      type: Object
    },
    isAnnotationBeingEditedNull: {
      type: Function
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

      console.log("ann id", annotation.id);
      this.$emit("handle-data-changes", {
        annotation: null,
        notEditing: null,
        isLoading: null,
        annotationClicked: { id: annotation.id, clicked: true }
      });
    },
    replaceExistingAnnotation(annotation) {
      console.log("clicked");
      // set ann value to be empty
      this.newValue = "";

      // Show bbox to select new text
      this.$store.dispatch("selection/enableSelection", annotation.id);
    },
    getAnnotationPlaceholder(annotationString) {
      if (annotationString === "") {
        // prevent contenteditable from being edited
        this.editable = false;
        console.log("empty");
        return this.$t("draw_box_document");
      }
      if (
        annotationString !== "" ||
        annotationString !== this.$t("draw_box_document")
      ) {
        console.log("not empty");

        return annotationString;
      } else if (this.selectionEnabled === this.annotation.id) {
        if (this.spanSelection && this.spanSelection.offset_string) {
          setTimeout(() => {
            //focus element
            this.$refs.annotation.focus();
          }, 200);
          return this.spanSelection.offset_string;
        } else {
          // prevent contenteditable from being edited
          this.editable = false;
          return this.$t("draw_box_document");
        }
      } else {
        // prevent contenteditable from being edited
        this.editable = false;
        return this.$t("no_data_found");
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
        notEditing: false,
        isLoading: null,
        annotationClicked: null
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
          notEditing: null,
          isLoading: null,
          annotationClicked: { id: null, clicked: false }
        });
        return;
      }

      this.$emit("handle-data-changes", {
        annotation: null,
        notEditing: null,
        isLoading: true,
        annotationClicked: null
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
              notEditing: null,
              isLoading: null,
              annotationClicked: null
            });
          } else {
            this.$refs.contentEditable.textContent = this.oldValue;
            this.newValue = this.oldValue;

            this.error = true;
            this.handleShowError();
            this.handleMessage(this.$i18n.t("editing_error"));

            this.$emit("handle-data-changes", {
              annotation: null,
              notEditing: true,
              isLoading: null,
              annotationClicked: null
            });
          }
        })
        .finally(() => {
          this.$store.dispatch("document/endLoading");
          this.$store.dispatch("selection/disableSelection");
          this.$emit("handle-data-changes", {
            annotation: null,
            notEditing: null,
            isLoading: false,
            annotationClicked: { id: null, clicked: false }
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
      if (this.annotationClicked.id === this.editing && !this.editable) {
        this.$refs.contentEditable.textContent = newValue.offset_string;
        this.newValue = newValue.offset_string;
        this.editable = true;
      }
    },
    newValue(newValue) {
      console.log(newValue);
      this.getAnnotationPlaceholder(newValue);
    }
  }
};
</script>
