<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <div class="empty-annotation">
    <span
      :class="[
        'label-property-value',
        isEmptyAnnotationEditable(annotation) ? '' : 'label-empty'
      ]"
      :contenteditable="isEmptyAnnotationEditable(annotation)"
      @click="event => handleEditEmptyAnnotation(event)"
      ref="emptyAnnotation"
    >
      {{ getEmptyAnnotationPlaceholder() }}
    </span>
    <ActionButtons
      v-if="showActionButtons()"
      @save="saveEmptyAnnotation"
      @cancel="cancelEmptyAnnotation"
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
  components: { ActionButtons },
  props: {
    annotation: {
      required: true
    },
    annotationSet: {
      required: true
    }
  },
  computed: {
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", ["activeAnnotationSet"])
  },
  methods: {
    emptyAnnotationId() {
      return `${this.annotationSet.id}_${this.annotation.label_id}`;
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
        label: this.annotation.label_id,
        annotation_set: this.activeAnnotationSet.id,
        is_correct: true,
        revised: true
      };
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          if (annotationCreated) {
            this.$store.dispatch("document/fetchAnnotations");
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
