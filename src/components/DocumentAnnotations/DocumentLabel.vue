<template>
  <div class="label">
    <div v-if="annotationSet">
      <AnnotationRow
        v-for="(annotation, index) in annotationsToShow()"
        :key="index"
        :annotation="annotation"
        :label="label"
        :annotation-set="annotationSet"
        :label-set="annotationSet.label_set"
      />
    </div>
    <div v-else-if="labelSet">
      <AnnotationRow :label="label" :label-set="labelSet" />
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import AnnotationRow from "./AnnotationRow";

/**
 * This component shows each label and its annotations
 */
export default {
  name: "DocumentLabel",
  components: { AnnotationRow },
  props: {
    label: {
      type: Object,
      required: true,
    },
    annotationSet: {
      type: Object,
      default: null,
    },
    labelSet: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapState("document", ["annotationId", "publicView"]),
    ...mapGetters("document", [
      "numberOfAcceptedAnnotationsInLabel",
      "isLabelMultiFalseAndGroupOfAnns",
    ]),
  },
  methods: {
    annotationsToShow() {
      if (this.isLabelMultiFalseAndGroupOfAnns(this.label)) {
        return [this.label.annotations[0]];
      } else {
        return this.label.annotations;
      }
    },
    labelHasPendingAnnotations(hoveredSet) {
      if (!hoveredSet) return;

      const found = this.label.annotations.find((ann) => !ann.is_correct);

      return this.annotationSet.id === hoveredSet.annotationSet.id && found;
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
