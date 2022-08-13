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
        isLoading && 'saving-changes',
        error && 'error-editing',
        isAnnotationEmpty && !isAnnotationInEditMode(annotation.id)
          ? 'label-empty'
          : ''
      ]"
      role="textbox"
      ref="contentEditable"
      :contenteditable="true"
      @paste="handlePaste"
      @keypress.enter="saveAnnotationChanges"
      @click="handleEditAnnotation"
    >
      {{ isAnnotationEmpty ? $t("no_data_found") : annotation.offset_string }}
    </span>
    <div v-if="isAnnotationInEditMode(annotation.id)" class="buttons-container">
      <ActionButtons
        :saveBtn="true"
        :cancelBtn="true"
        :isActive="!isLoading"
        :isLoading="isLoading"
        @cancel="handleCancel"
        @save="saveAnnotationChanges"
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
    isLoading: {
      type: Boolean
    },
    handleShowError: {
      type: Function
    },
    handleMessage: {
      type: Function
    }
  },
  data() {
    return {
      error: null
    };
  },
  components: {
    ActionButtons
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode", "pageSelected"]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    annotationText() {
      if (this.isAnnotationInEditMode(this.annotation.id)) {
        return this.$refs.contentEditable.textContent.trim();
      } else {
        return this.annotation.offset_string;
      }
    },
    isAnnotationEmpty() {
      return this.annotation.revised && !this.annotation.is_correct;
    }
  },
  methods: {
    setText(text) {
      this.$refs.contentEditable.textContent = text;
    },
    handleEditAnnotation() {
      if (!this.isAnnotationInEditMode(this.annotation.id) && !this.isLoading) {
        const span = this.annotation.span[0];

        if (this.isAnnotationEmpty) {
          this.setText("");
        }

        if (this.pageSelected) {
          this.$store.dispatch("selection/enableSelection", this.annotation.id);
          const { x, y, width, height } = this.bboxToRect(
            this.pageSelected,
            span
          );

          const selection = {
            start: {
              x,
              y
            },
            end: {
              x: x + width,
              y: y + height
            },
            pageNumber: this.pageSelected.number
          };

          this.$store.dispatch("selection/setSelection", {
            selection,
            span
          });
          this.$store.dispatch(
            "document/setEditAnnotation",
            this.annotation.id
          );
        }
      }
    },
    handleCancel() {
      this.setText(
        this.isAnnotationEmpty
          ? this.$t("no_data_found")
          : this.annotation.span[0].offset_string
      );
      this.$store.dispatch("document/setEditAnnotation", null);
      this.$store.dispatch("selection/disableSelection");
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
      const spanArray = this.annotation.span[0];
      let updatedString;

      // If the user didn't change the value, we don't want to do anything
      if (this.annotationText === spanArray.offset_string) {
        this.$emit("handle-data-changes", {
          annotation: null,
          isLoading: null
        });
        this.handleCancel();
        return;
      }

      this.$emit("handle-data-changes", {
        annotation: null,
        isLoading: true
      });

      if (this.annotationText.length === 0) {
        updatedString = {
          is_correct: false,
          revised: true
        };
      } else {
        updatedString = {
          is_correct: true,
          span: [
            {
              offset_string: this.annotationText,
              bottom: this.spanSelection.bottom,
              top: this.spanSelection.top,
              page_index: this.spanSelection.page_index,
              x0: this.spanSelection.x0,
              x1: this.spanSelection.x1,
              y0: this.spanSelection.y0,
              y1: this.spanSelection.y1,
              start_offset: this.spanSelection.start_offset,
              end_offset: this.spanSelection.end_offset
            }
          ]
        };
      }

      this.$store.dispatch("document/startLoading");

      // Send to the store for the http patch request
      this.$store
        .dispatch("document/updateAnnotation", {
          updatedValues: updatedString,
          annotationId: this.annotation.id
        })
        .then(response => {
          // Check if the response is successful or not
          if (response) {
            this.$store.dispatch("document/fetchAnnotations");
            this.$emit("handle-data-changes", {
              annotation: null,
              isLoading: null
            });
            this.setText(
              this.annotationText === ""
                ? this.$t("no_data_found")
                : this.annotationText
            );
          } else {
            this.error = true;
            this.handleShowError();
            this.handleMessage(this.$i18n.t("editing_error"));
            this.setText(
              this.isAnnotationEmpty
                ? this.$t("no_data_found")
                : this.annotation.span[0].offset_string
            );
            this.$emit("handle-data-changes", {
              annotation: null,
              isLoading: null
            });
          }
        })
        .finally(() => {
          this.$store.dispatch("document/setEditAnnotation", null);
          this.$store.dispatch("document/endLoading");
          this.$store.dispatch("selection/disableSelection");
          this.$emit("handle-data-changes", {
            annotation: null,
            isLoading: false
          });

          this.$refs.contentEditable.blur();

          setTimeout(() => {
            this.error = false;
          }, 2000);
        });
    }
  },
  watch: {
    spanSelection(span) {
      if (
        this.isAnnotationInEditMode(this.annotation.id) &&
        span &&
        span.offset_string &&
        span.offset_string !== this.annotation.span[0].offset_string
      ) {
        this.setText(span.offset_string);
      }
    }
  }
};
</script>
