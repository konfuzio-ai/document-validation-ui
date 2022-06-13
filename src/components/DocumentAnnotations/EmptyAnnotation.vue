<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <span
    class="label-property-value label-empty"
    :contenteditable="isEmptyAnnotationEditable(annotation, annotationSet)"
    @click="
      event => handleEditEmptyAnnotation(event, annotation, annotationSet)
    "
    @keypress.enter="event => saveEmptyAnnotation(event, annotation)"
    :ref="`emptyAnnotation_${getEmptyAnnotationIdentifier(
      annotation,
      annotationSet
    )}`"
  >
    {{ getEmptyAnnotationPlaceholder(annotation, annotationSet) }}
  </span>
</template>
<script>
import { mapGetters, mapState } from "vuex";
/**
 * This component is responsible for managing empty annotations.
 */
export default {
  name: "EmptyAnnotation",

  props: {
    annotation: {
      required: true
    },
    annotationSet: {
      required: true
    }
  },
  computed: {
    ...mapGetters("selection", ["isSelectionEnabled"]),
    ...mapState("selection", ["spanSelection", "selectionEnabledForId"])
  },
  methods: {
    getEmptyAnnotationIdentifier(annotation, annotationSet) {
      return `${annotation.label_id}_${annotationSet.id}`;
    },
    handleEditEmptyAnnotation(event, annotation, annotationSet) {
      const selectionId = this.getEmptyAnnotationIdentifier(
        annotation,
        annotationSet
      );
      if (this.selectionEnabledForId !== selectionId) {
        this.handleCancelEmptyAnnotation();
        this.$store.dispatch("selection/enableSelection", selectionId);
      }
    },
    handleCancelEmptyAnnotation() {
      console.log("handleBlurEmptyAnnotation");
      this.$store.dispatch("selection/disableSelection");
    },
    saveEmptyAnnotation(event, annotation) {
      this.$store.dispatch("selection/disableSelection");
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
    isEmptyAnnotationEditable(annotation, annotationSet) {
      return (
        this.selectionEnabledForId ===
          this.getEmptyAnnotationIdentifier(annotation, annotationSet) &&
        this.spanSelection &&
        !this.spanSelection.offset_string
      );
    },
    getEmptyAnnotationPlaceholder(annotation, annotationSet) {
      if (
        this.selectionEnabledForId ===
        this.getEmptyAnnotationIdentifier(annotation, annotationSet)
      ) {
        if (this.spanSelection && !this.spanSelection.offset_string) {
          // the bounding box had no text result we enable the edit feature
          setTimeout(() => {
            //focus element
            this.$refs[
              `emptyAnnotation_${this.getEmptyAnnotationIdentifier(
                annotation,
                annotationSet
              )}`
            ].focus();
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
