<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="labels-sidebar">
    <!-- When extracting annotations after rotating -->
    <div v-if="recalculatingAnnotations">
      <ExtractingData />
    </div>
    <!-- When there's no annotations in the label -->
    <div v-else-if="!annotationSets || annotationSets.length === 0">
      <EmptyState />
    </div>
    <div
      v-else
      :class="['labels-list', rejectedLabelList.length && 'showing-rejected']"
    >
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
          :handleScroll="handleScroll"
          :indexGroup="indexGroup"
          :handleShowError="handleShowError"
          :handleMessage="handleMessage"
        />
      </div>
      <div v-if="rejectedLabelList.length" class="rejected-labels-list">
        <RejectedLabels :rejectedLabelList="rejectedLabelList" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import EmptyState from "./EmptyState";
import ExtractingData from "./ExtractingData";
import CaretDown from "../../assets/images/CaretDownImg";
import ActionButtons from "./ActionButtons";
import Label from "./Label";
import RejectedLabels from "./RejectedLabels.vue";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    ExtractingData,
    CaretDown,
    ActionButtons,
    Label,
    RejectedLabels
  },
  props: {
    scroll: {
      type: Boolean
    },
    handleScroll: {
      type: Function
    }
  },
  data() {
    return {
      rejectedLabelList: [
        { id: 1, name: "name1" },
        { id: 2, name: "name2" },
        { id: 3, name: "name3" },
        { id: 4, name: "name4" },
        { id: 5, name: "name5" },
        { id: 6, name: "name6" },
        { id: 7, name: "name7" },
        { id: 8, name: "name8" },
        { id: 9, name: "name9" }
      ]
    };
  },
  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "annotationSets",
      "missingAnnotations"
    ])
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
    },
    handleShowError() {
      this.$emit("handle-error", true);
    },
    handleMessage(message) {
      this.$emit("handle-message", message);
    }
  }
};
</script>
