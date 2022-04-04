<template>
  <div class="labels">
    <div
      class="labels-container"
      v-if="groupedAnnotationSets && groupedAnnotationSets.length > 0"
    >
      <div class="labels-tabs">
        <ul>
          <li
            :class="[
              activeLabelSet &&
                activeLabelSet.id == annotationSet.id &&
                'is-active',
              'label-tab'
            ]"
            v-for="annotationSet in groupedAnnotationSets"
            v-bind:key="annotationSet.id"
          >
            <a v-on:click="onLabelSetClick(annotationSet)"
              >{{ annotationSet.label_set.name }}
              <span class="label-counter"
                >{{ perfectConfidenceTotalInAnnotationSet(annotationSet) }}/{{
                  totalAnnotationsInAnnotationSet(annotationSet)
                }}</span
              >
            </a>
          </li>
        </ul>
      </div>
      <Labels></Labels>
    </div>
    <!-- When there's no label sets -->
    <div
      v-if="groupedAnnotationSets && groupedAnnotationSets.length == 0"
      class="empty-labelsets"
    >
      <EmptyStateImg />
      <div class="empty-text">
        <p class="title" v-translate>No label sets found</p>
        <p class="description" v-translate>
          There are no label sets in this document.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import Labels from "./Labels";
import EmptyStateImg from "./assets/EmptyStateImg";
/**
 * This component creates a tab list filter of the label sets
 * with a confidence counter next to it. It also loads the properties for each label set.
 */
export default {
  components: { Labels, EmptyStateImg },
  computed: {
    ...mapGetters("sidebar", {
      totalAnnotationsInAnnotationSet: "totalAnnotationsInAnnotationSet",
      perfectConfidenceTotalInAnnotationSet:
        "perfectConfidenceTotalInAnnotationSet",
      groupedAnnotationSets: "groupedAnnotationSets"
    }),
    ...mapState("sidebar", {
      activeLabelSet: "activeLabelSet"
    })
  },
  methods: {
    onLabelSetClick(labelSet) {
      this.$store.dispatch("sidebar/setActiveLabelSet", labelSet);
    }
  },
  watch: {
    groupedAnnotationSets() {
      // Select first tab if none is selected
      if (
        !this.activeLabelSet &&
        this.groupedAnnotationSets &&
        this.groupedAnnotationSets.length > 0
      ) {
        this.onLabelSetClick(this.groupedAnnotationSets[0]);
      }
    }
  }
};
</script>
