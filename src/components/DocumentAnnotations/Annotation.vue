<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="annotation">
    <span
      :class="[
        'label-property-value',
        !notEditing &&
          isLoading &&
          isAnnotationBeingEditedNull() === annotation.id &&
          'saving-changes'
      ]"
      role="textbox"
      contenteditable
      @blur="event => handleBlur(event, annotation)"
      @paste="event => handlePaste(event, annotation)"
      @input="event => handleInput(event, annotation)"
      @keypress.enter="event => event.preventDefault()"
    >
      {{ annotation.span[0].offset_string }}
    </span>
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
import ActionButtons from "./ActionButtons";

export default {
  name: "Annotation",
  props: {
    annotation: {
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
      showLoading: false
    };
  },
  components: {
    ActionButtons
  },
  methods: {
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
        isLoading: null
      });
      // this.$emit("handle-show-warning", false);
      this.$emit("handle-show-error", false);

      // If the user changes the input by adding to the existing annotation
      // we show a warning
      // if (!newInOldValue || this.newValue.length === 0) {
      //   this.$emit("handle-show-warning", true);
      // }
    },
    handleBlur(event, annotation) {
      const spanArray = annotation.span[0];
      const id = annotation.id;
      let updatedString;

      // If the user didn't change the value, we don't want to do anything
      if (this.newValue === this.oldValue) {
        return;
      }

      this.$emit("handle-data-changes", {
        annotation: null,
        notEditing: null,
        edited: null,
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
              isLoading: null
            });
          } else {
            event.target.textContent = this.oldValue;
            this.newValue = this.oldValue;
            // Change to emit events
            this.$emit("handle-show-error", true);
            // this.$emit("handle-show-warning", false);
            this.$emit("handle-data-changes", {
              annotation: null,
              notEditing: null,
              edited: false,
              isLoading: null
            });
          }
        })
        .finally(() => {
          this.$store.dispatch("document/endLoading");
          this.$emit("handle-data-changes", {
            annotation: null,
            notEditing: null,
            edited: null,
            isLoading: false
          });
        });
    }
  }
};
</script>
