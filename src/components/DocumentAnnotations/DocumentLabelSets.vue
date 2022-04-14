<template>
  <div id="sidebar-container" class="labels">
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
    <div
      v-if="groupedAnnotationSets && groupedAnnotationSets.length == 0"
      class="empty-labelsets"
    >
      <EmptyStateImg />
      <div class="empty-text">
        <p class="title">{{ $t("no_label_sets_found") }}</p>
        <p class="description">
          {{ $t("no_label_sets_found_description") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import DocumentLabels from "./DocumentLabels";
import EmptyStateImg from "../../assets/EmptyStateImg";
/**
 * This component creates a tab list filter of the label sets
 * with a confidence counter next to it. It also loads the properties for each label set.
 */
export default {
  components: { DocumentLabels, EmptyStateImg },
  computed: {
    ...mapGetters("sidebar", {
      totalAnnotationsInAnnotationSet: "totalAnnotationsInAnnotationSet",
      perfectConfidenceTotalInAnnotationSet:
        "perfectConfidenceTotalInAnnotationSet",
      groupedAnnotationSets: "groupedAnnotationSets"
    }),
    ...mapState("sidebar", {
      activeAnnotationSet: "activeAnnotationSet",
      annotationSelected: "annotationSelected"
    })
  },
  methods: {
    onAnnotationSetClick(annotationSet) {
      this.$store.dispatch("sidebar/setActiveAnnotationSet", annotationSet);
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
    annotationSelected() {
      // change programmatically the selected annotation set
      if (
        this.annotationSelected &&
        this.annotationSelected.annotation_set &&
        this.annotationSelected.annotation_set.label_set.id !=
          this.activeAnnotationSet.label_set.id
      ) {
        // check if the label set is on the same group of annotations set and
        // if so, no need to change the active annotation set
        const annotationSet = this.groupedAnnotationSets.find(
          el =>
            el.label_set.id ===
            this.annotationSelected.annotation_set.label_set.id
        );
        this.onAnnotationSetClick(annotationSet);
      }
    }
  }
};
</script>
