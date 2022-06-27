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
      v-if="isEditing && this.spanSelection && this.spanSelection.offset_string"
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
    }
  },
  data() {
    return {
      isEditing: false,
      // TODO: under development
      enableBboxes: true
    };
  },
  computed: {
    ...mapState("selection", ["spanSelection"]),
    ...mapState("document", ["activeAnnotationSet"])
  },
  methods: {
    handleEditEmptyAnnotation() {
      if (!this.enableBboxes) {
        return;
      }
      if (!this.isEditing) {
        this.isEditing = true;
        this.$store.dispatch("selection/enableSelection");
      }
    },
    saveEmptyAnnotation() {
      if (!this.enableBboxes) {
        return;
      }
      // update the bbox text with the one from the input
      this.spanSelection.offset_string = this.$refs.emptyAnnotation.textContent;
      this.spanSelection.offset_string_original =
        this.$refs.emptyAnnotation.textContent;

      // TODO: if has multiple label set groups then label set should be used, otherwise annotation set id should be used.

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
      this.isEditing = false;
      this.$store.dispatch("selection/disableSelection");
    },
    isEmptyAnnotationEditable() {
      if (!this.enableBboxes) {
        return false;
      }
      return (
        this.isEditing && this.spanSelection && this.spanSelection.offset_string
      );
    },
    getEmptyAnnotationPlaceholder() {
      if (!this.enableBboxes) {
        return "";
      }
      if (this.isEditing) {
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
    }
  }
};
</script>
