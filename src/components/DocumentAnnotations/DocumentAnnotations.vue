<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="labels-sidebar">
    <div v-if="!recalculatingAnnotations" class="labels-list">
      <div
        v-for="(annotationSet, indexGroup) in annotationSets"
        v-bind:key="indexGroup"
        class="labelset-group"
      >
        <div class="label-set-name">
          {{
            `${annotationSet.label_set.name} ${getNumberOfAnnotationSetGroup(
              annotationSet
            )}`
          }}
        </div>
        <Label
          v-for="label in annotationSet.labels"
          v-bind:key="label.id"
          :label="label"
          :annotationSet="annotationSet"
        />
      </div>
    </div>
    <!-- When label is rejected -->
    <!-- <div v-if="rejected.length > 0" class="rejected-labels">
      <RejectedLabels />
    </div> -->
    <!-- When there's no annotations in the label -->
    <div
      v-if="
        !recalculatingAnnotations &&
        (!annotationSets || !annotationSets.length > 0)
      "
    >
      <EmptyState />
    </div>

    <!-- When extracting annotations after rotating -->
    <div v-if="recalculatingAnnotations">
      <ExtractingData />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import EmptyState from "./EmptyState";
import ExtractingData from "./ExtractingData";
import CaretDown from "../../assets/images/CaretDownImg";
import ActionButtons from "./ActionButtons";
import RejectedLabels from "./RejectedLabels";
import Label from "./Label";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    ExtractingData,
    CaretDown,
    ActionButtons,
    RejectedLabels,
    Label
  },
  computed: {
    ...mapState("document", ["recalculatingAnnotations", "annotationSets"])
  },
  methods: {
    getNumberOfAnnotationSetGroup(annotationSet) {
      // This method checks if theres a group of annotation sets and add an index number to them
      let found = false;
      let value = 0;
      let index = 0;
      this.annotationSets.map(annotationSetTemp => {
        if (
          annotationSetTemp.label_set.name === annotationSet.label_set.name &&
          annotationSetTemp.id !== annotationSet.id
        ) {
          found = true;
          index++;
        } else if (annotationSetTemp.id === annotationSet.id) {
          value = index;
        }
      });
      return found ? `${value + 1}` : "";
    }
  }
};
</script>
