<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="empty-annotation">
    <span
      :class="[
        'label-property-value',
        isEmptyAnnotationEditable() ? '' : 'label-empty'
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @click="event => handleEditEmptyAnnotation(event)"
      ref="emptyAnnotation"
    >
      {{ getEmptyAnnotationPlaceholder() }}
    </span>
    <ActionButtons
      v-if="showActionButtons()"
      :saveBtn="saveBtn"
      :cancelBtn="cancelBtn"
      @save="saveEmptyAnnotation"
      @cancel="cancelEmptyAnnotation"
      :isLoading="isLoading"
    />
  </div>
</template>
<script>
import { mapState } from "vuex";
import ActionButtons from "./ActionButtons";
/**
 * This component is responsible for managing empty annotations.
 */
export default {
  name: "EmptyAnnotation",
  data() {
    return {
      saveBtn: true,
      cancelBtn: true,
      isLoading: false
    };
  },
  components: { ActionButtons },
  props: {
    label: {
      required: true
    },
    annotationSet: {
      required: true
    }
  },
  computed: {
    ...mapState("selection", ["spanSelection", "selectionEnabled"])
  },
  methods: {
    emptyAnnotationId() {
      return `${this.annotationSet.id}_${this.label.id}`;
    },
    handleEditEmptyAnnotation() {
      if (this.selectionEnabled !== this.emptyAnnotationId()) {
        this.$store.dispatch(
          "selection/enableSelection",
          this.emptyAnnotationId()
        );
      }
    },
    saveEmptyAnnotation() {
      // update the bbox text with the one from the input
      this.spanSelection.offset_string = this.$refs.emptyAnnotation.textContent;
      this.spanSelection.offset_string_original =
        this.$refs.emptyAnnotation.textContent;

      const annotationToCreate = {
        span: [this.spanSelection],
        label: this.label.id,
        annotation_set: this.annotationSet.id,
        is_correct: true,
        revised: true
      };
      this.isLoading = true;
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          if (annotationCreated) {
            this.isLoading = false;
            this.$emit("handle-data-changes", {
              annotation: annotationCreated,
              notEditing: false,
              edited: false,
              isLoading: false
            });
          }
        });
      this.cancelEmptyAnnotation();
    },
    cancelEmptyAnnotation() {
      this.$store.dispatch("selection/disableSelection");
    },
    isEmptyAnnotationEditable() {
      return (
        this.selectionEnabled === this.emptyAnnotationId() &&
        this.spanSelection &&
        this.spanSelection.offset_string
      );
    },
    getEmptyAnnotationPlaceholder() {
      if (this.selectionEnabled === this.emptyAnnotationId()) {
        if (this.spanSelection && this.spanSelection.offset_string) {
          setTimeout(() => {
            //focus element
            this.$refs.emptyAnnotation.focus();
          }, 200);
          return this.spanSelection.offset_string;
        } else {
          return this.$t("draw_box_document");
        }
      } else {
        return this.$t("no_data_found");
      }
    },
    showActionButtons() {
      return (
        this.selectionEnabled === this.emptyAnnotationId() &&
        this.spanSelection &&
        this.spanSelection.offset_string
      );
    }
  }
};
</script>
