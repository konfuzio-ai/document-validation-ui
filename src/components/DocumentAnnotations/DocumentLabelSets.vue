<style
  scoped
  lang="scss"
  src="../../assets/scss/document_label_sets.scss"
></style>

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
              activeAnnotationSet &&
                activeAnnotationSet.id == annotationSet.id &&
                'is-active',
              'label-tab'
            ]"
            v-for="annotationSet in groupedAnnotationSets"
            v-bind:key="annotationSet.id"
          >
            <a v-on:click="onAnnotationSetClick(annotationSet)"
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
      <DocumentLabels />
    </div>
    <!-- When there's no label sets -->
    <div v-if="groupedAnnotationSets && groupedAnnotationSets.length == 0">
      <EmptyState />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import DocumentLabels from "./DocumentLabels";
import EmptyState from "./EmptyState";

/**
 * This component creates a tab list filter of the label sets
 * with a confidence counter next to it. It also loads the properties for each label set.
 */
export default {
  components: { DocumentLabels, EmptyState },
  computed: {
    ...mapGetters("document", {
      totalAnnotationsInAnnotationSet: "totalAnnotationsInAnnotationSet",
      perfectConfidenceTotalInAnnotationSet:
        "perfectConfidenceTotalInAnnotationSet",
      groupedAnnotationSets: "groupedAnnotationSets"
    }),
    ...mapState("document", {
      activeAnnotationSet: "activeAnnotationSet",
      sidebarAnnotationSelected: "sidebarAnnotationSelected"
    })
  },
  methods: {
    onAnnotationSetClick(annotationSet) {
      this.$store.dispatch("document/setActiveAnnotationSet", annotationSet);
      this.$store.dispatch("selection/disableSelection");
    }
  },
  watch: {
    groupedAnnotationSets() {
      // Select first tab if none is selected
      if (
        !this.activeAnnotationSet &&
        this.groupedAnnotationSets &&
        this.groupedAnnotationSets.length > 0
      ) {
        this.onAnnotationSetClick(this.groupedAnnotationSets[0]);
      }
    },
    sidebarAnnotationSelected() {
      // change programmatically the selected annotation set
      if (
        this.sidebarAnnotationSelected &&
        this.sidebarAnnotationSelected.annotation_set &&
        this.sidebarAnnotationSelected.annotation_set.label_set.id !=
          this.activeAnnotationSet.label_set.id
      ) {
        // check if the label set is on the same group of annotations set and
        // if so, no need to change the active annotation set
        const annotationSet = this.groupedAnnotationSets.find(
          el =>
            el.label_set.id ===
            this.sidebarAnnotationSelected.annotation_set.label_set.id
        );
        this.onAnnotationSetClick(annotationSet);
      }
    }
  }
};
</script>
