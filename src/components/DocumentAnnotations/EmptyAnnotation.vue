<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <span
    class="label-property-value label-empty"
    :contenteditable="isEmptyAnnotationEditable(annotation)"
    @click="event => handleEditEmptyAnnotation(event)"
    @keypress.enter="event => saveEmptyAnnotation(event)"
    ref="emptyAnnotation"
  >
    {{ getEmptyAnnotationPlaceholder() }}
  </span>
</template>
<script>
import { mapState } from "vuex";
/**
 * This component is responsible for managing empty annotations.
 */
export default {
  name: "EmptyAnnotation",

  props: {
    annotation: {
      required: true
    }
  },
  data() {
    return {
      isEditing: false
    };
  },
  computed: {
    ...mapState("selection", ["spanSelection"]),
    ...mapState("document", ["activeAnnotationSet"])
  },
  methods: {
    handleEditEmptyAnnotation() {
      console.log(this.activeAnnotationSet);
      if (!this.isEditing) {
        this.isEditing = true;
        this.$store.dispatch("selection/enableSelection");
      }
    },
    handleCancelEmptyAnnotation() {
      this.$store.dispatch("selection/disableSelection");
    },
    saveEmptyAnnotation(event, annotation) {
      this.$store.dispatch("selection/disableSelection");
      // TODO: label_set should be annotation_set

      const annotationToCreate = {
        span: [this.spanSelection],
        label: annotation.label_id,
        label_set: this.activeAnnotationSet.label_set.id,
        is_correct: true,
        revised: true
      };
      console.log(annotationToCreate);
      this.$store.dispatch("document/createAnnotation", annotationToCreate);
    },
    isEmptyAnnotationEditable() {
      return (
        this.isEditing &&
        this.spanSelection &&
        !this.spanSelection.offset_string
      );
    },
    getEmptyAnnotationPlaceholder() {
      if (this.isEditing) {
        if (this.spanSelection && !this.spanSelection.offset_string) {
          // the bounding box had no text result we enable the edit feature
          setTimeout(() => {
            //focus element
            this.$refs.emptyAnnotation.focus();
          }, 200);
          return "";
        } else if (this.spanSelection && this.spanSelection.offset_string) {
          return this.spanSelection.offset_string;
        } else {
          return "Please create a box on the document";
        }
      } else {
        return this.$t("no_data_found");
      }
    }
  }
};
</script>
