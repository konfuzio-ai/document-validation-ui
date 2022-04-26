<style scoped lang="scss">
.labels {
  width: 40%;
  background-color: var(--labelsBackgroundColor);
  overflow: auto;
  height: calc(100vh - var(--headerSize));

  .labels-container {
    padding: 16px;
  }
  .labels-tabs {
    -webkit-overflow-scrolling: touch;
    align-items: stretch;
    display: flex;
    font-size: 1rem;
    justify-content: space-between;
    overflow: hidden;
    overflow-x: auto;
    white-space: nowrap;

    ul {
      flex-wrap: wrap;
      width: 100%;
      padding: 0;
      margin: 0;
      display: flex;
      flex-grow: 1;
      flex-shrink: 0;
      border-bottom: none;
      align-items: center;
      justify-content: center;
    }

    li {
      flex-grow: 1;
      flex-shrink: 0;
      list-style-type: none;
    }

    .label-tab {
      a {
        color: var(--secondaryTextColor);
        border-bottom: 1px solid var(--detailColor);
        cursor: pointer;
        font-size: 14px;
        line-height: 20px;
        transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
        font-family: "Inter", sans-serif;
        align-items: center;
        display: flex;
        justify-content: center;
        margin-bottom: -1px;
        padding: 0.5em 1em;
        vertical-align: top;

        .label-counter {
          color: var(--secondaryTextColor);
          margin-left: 4px;
          padding: 0 8px;
          background: var(--bgColor);
          border-radius: 500px;
          font-size: 12px;
          transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }
      }

      &.is-active {
        a {
          color: var(--primaryColor);
          border-width: 2px;
          border-bottom-color: var(--primaryColor);
          font-family: "Inter", sans-serif;

          .label-counter {
            color: var(--primaryColor);
            background: var(--lowOpacityPrimaryColor);
          }
        }
      }
      &:not(.is-active) {
        a:hover {
          border-bottom-color: var(--secondaryTextColor);
          color: var(--secondaryTextColor);
        }
      }
    }
  }
}
</style>

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
