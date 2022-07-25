<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div
    class="annotation"
    @click="annotation.label_description && onLabelClick(annotation)"
    ref="annotation"
  >
    <span
      :class="[
        'label-property-value',
        !editable && 'label-empty',
        !notEditing &&
          isLoading &&
          isAnnotationBeingEditedNull() === annotation.id &&
          'saving-changes'
      ]"
      role="textbox"
      ref="contentEditable"
      :contenteditable="editable"
      @paste="event => handlePaste(event, annotation)"
      @input="event => handleInput(event, annotation)"
      @keypress.enter="event => event.preventDefault()"
      @click="handleEditAnnotation(annotation)"
    >
      {{ annotation.span[0].offset_string }}
    </span>
    <div
      v-if="annotationClicked.clicked && annotation.id === annotationClicked.id"
      class="buttons-container"
      @blur="event => handleButtonsClicked(event)"
    >
      <ActionButtons
        :cancelBtn="cancelBtn"
        :annotationClicked="annotationClicked.clicked"
        @cancel="replaceExistingAnnotation(annotation)"
      />
      <ActionButtons
        :saveBtn="saveBtn"
        :annotationClicked="annotationClicked.clicked"
        @save="saveAnnotationChanges"
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
    annotationClicked: {
      type: Object
    },
    isLoading: {
      type: Boolean
    },
    edited: {
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
    }
  },
  data() {
    return {
      oldValue: null,
      newValue: null,
      showLoading: false,
      saveBtn: true,
      cancelBtn: true,
      editable: true
    };
  },
  components: {
    ActionButtons
  },
  computed: {
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapGetters("selection", ["getSelectionFromBboxForPage"])
  },
  methods: {
    handleButtonsClicked(event) {
      event.preventDefault();
    },
    handleEditAnnotation(annotation) {
      this.$emit("handle-data-changes", {
        annotation: null,
        notEditing: null,
        edited: null,
        isLoading: null,
        annotationClicked: { id: annotation.id, clicked: true }
      });

      this.getSelectionFromBboxForPage();
    },
    replaceExistingAnnotation(annotation) {
      this.$store.dispatch("selection/enableSelection", annotation.id);
      this.editable = false;

      if (this.selectionEnabled === annotation.id) {
        if (this.spanSelection && this.spanSelection.offset_string) {
          setTimeout(() => {
            //focus element
            this.$refs.annotation.focus();
          }, 200);
          return this.spanSelection.offset_string;
        } else {
          return this.$t("draw_box_document");
        }
      } else {
        return this.$t("no_data_found");
      }
    },
    isNewValueInOld(event, annotation) {
      this.oldValue = annotation.span[0].offset_string;
      this.newValue = event.target.textContent.trim();
      return this.oldValue.includes(this.newValue);
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    handleInput(event, annotation) {
      const newInOldValue = this.isNewValueInOld(event, annotation);

      this.$emit("handle-data-changes", {
        annotation,
        notEditing: false,
        edited: null,
        isLoading: null,
        annotationClicked: null
      });
      this.$emit("handle-show-warning", false);
      this.$emit("handle-show-error", false);

      // If the user changes the input by adding to the existing annotation
      // we show a warning
      if (!newInOldValue || this.newValue.length === 0) {
        this.$emit("handle-show-warning", true);
      }
    },
    saveAnnotationChanges(event, annotation) {
      const spanArray = annotation.span[0];
      const id = annotation.id;
      let updatedString;

      // If the user didn't change the value, we don't want to do anything
      if (this.newValue === this.oldValue) {
        this.$emit("handle-data-changes", {
          annotation: null,
          notEditing: null,
          edited: null,
          isLoading: null,
          annotationClicked: { id: null, clicked: false }
        });
        return;
      }

      this.$emit("handle-data-changes", {
        annotation: null,
        notEditing: null,
        edited: null,
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
            this.$emit("handle-data-changes", {
              annotation: null,
              notEditing: null,
              edited: true,
              isLoading: null,
              annotationClicked: null
            });
          } else {
            event.target.textContent = this.oldValue;
            this.newValue = this.oldValue;
            this.$emit("handle-show-error", true);
            this.$emit("handle-show-warning", false);
            this.$emit("handle-data-changes", {
              annotation: null,
              notEditing: null,
              edited: false,
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
            edited: null,
            isLoading: false,
            annotationClicked: { id: null, clicked: false }
          });
        });
    }
  }
};
</script>
