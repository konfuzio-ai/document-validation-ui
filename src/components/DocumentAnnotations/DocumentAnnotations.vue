<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="labels-sidebar">
    <div class="labels-top-bar">
      <AnnotationsTopBar />
    </div>

    <!-- When extracting annotations after editing -->
    <div v-if="recalculatingAnnotations">
      <ExtractingData />
    </div>

    <!-- When document data is still loading -->
    <div v-else-if="!imageLoaded && !recalculatingAnnotations">
      <div v-for="n in numberOfLoadingAnnotations" :key="n">
        <LoadingAnnotations />
      </div>
    </div>

    <!-- When there's no annotations in the label -->
    <div v-else-if="!annotationSets || annotationSets.length === 0">
      <EmptyState />
    </div>

    <div
      v-else
      :class="['labels-list', missingAnnotations.length && 'showing-rejected']"
    >
      <div
        v-for="(annotationSet, indexGroup) in annotationSets"
        v-bind:key="indexGroup"
        class="labelset-group"
      >
        <div class="label-set-name">
          {{
            `${annotationSet.label_set.name} ${numberOfAnnotationSetGroup(
              annotationSet
            )}`
          }}
        </div>
        <div v-for="label in annotationSet.labels" :key="label.id">
          <Label
            v-if="label.id === labelNotRejected(label)"
            :label="label"
            :annotationSet="annotationSet"
            :handleScroll="handleScroll"
            :indexGroup="indexGroup"
            @handle-reject="rejectAnnotation"
          />
        </div>
      </div>
    </div>

    <div
      v-if="!publicView && missingAnnotations.length && imageLoaded"
      class="rejected-labels-list"
    >
      <RejectedLabels :missingAnnotations="missingAnnotations" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import EmptyState from "./EmptyState";
import ExtractingData from "./ExtractingData";
import CaretDown from "../../assets/images/CaretDownImg";
import ActionButtons from "./ActionButtons";
import Label from "./Label";
import RejectedLabels from "./RejectedLabels";
import LoadingAnnotations from "./LoadingAnnotations";
import AnnotationsTopBar from "./AnnotationsTopBar";

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
    RejectedLabels,
    LoadingAnnotations,
    AnnotationsTopBar
  },
  props: {
    handleScroll: {
      type: Function
    }
  },
  data() {
    return {
      count: 0,
      jumpToNextAnnotation: false,
      numberOfLoadingAnnotations: 3
    };
  },
  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "annotations",
      "annotationSets",
      "missingAnnotations",
      "publicView",
      "editingActive",
      "annotations",
      "editAnnotation",
      "imageLoaded",
      "acceptAnnotation"
    ]),
    ...mapGetters("document", ["numberOfAnnotationSetGroup"])
  },
  created() {
    window.addEventListener("keydown", this.keyDownHandler);
  },
  destroyed() {
    window.removeEventListener("keydown", this.keyDownHandler);
  },
  methods: {
    focusOnNextAnnotation() {
      const annotations = Array.from(
        document.getElementsByClassName("annotation-value")
      );
      if (annotations[this.count]) {
        annotations[this.count].click();
      } else {
        this.count = 0;
        this.$store.dispatch("document/setEditingActive", false);
        return;
      }
    },

    keyDownHandler(event) {
      // get out of edit mode and navigation
      if (event.key === "Escape") {
        this.count = 0;
        this.$store.dispatch("document/setEditingActive", false);
        return;
      }

      // Not allow starting edit mode with ArrowUp key
      if (event.key === "ArrowUp" && !this.editingActive) return;

      this.$store.dispatch("document/setEditingActive", true);

      // Create an array from the elements selected
      // for easier management of data
      const annotations = Array.from(
        document.getElementsByClassName("annotation-value")
      );
      // Get clicked element to get the index
      const clickedAnnotations = Array.from(
        document.getElementsByClassName("clicked")
      );

      // get index of currently active element
      const currentAnnIndex = annotations.findIndex(
        el => el === clickedAnnotations[0]
      );

      // navigate with the arrow up or down keys
      if (event.key === "ArrowDown") {
        if (this.count >= annotations.length) {
          const finishBtn = Array.from(
            document.getElementsByClassName("finish-review-btn")
          );
          finishBtn[0].focus();
          this.$store.dispatch("document/setEditAnnotation", {
            id: null,
            index: null
          });
          this.count = 0;
          if (event.key === "Enter" && !finishBtn.disabled) {
            finishBtn.click();
          }
          return;
        }

        /**
         * Enable navigation when some annotation is already focused
         */
        // Update count to avoid restarting the navigation
        if (clickedAnnotations[0]) {
          this.count = currentAnnIndex + 1;
        }

        // set focused annotation to scroll in the document page
        if (
          annotations[this.count] &&
          !annotations[this.count].className.includes("label-empty")
        ) {
          this.$store.dispatch(
            "document/setDocumentFocusedAnnotation",
            this.annotations[this.count - 1]
          );
        } else {
          this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
        }

        annotations[this.count].click();
        this.count++;
      } else if (event.key === "ArrowUp") {
        // Check if the event happened on the first element from the array
        // If so, reset count to 0
        if (clickedAnnotations[0] === annotations[0]) {
          this.count = 0;
          return;
        }

        /**
         * Enable navigation when some annotation is already focused
         */
        // Update count to avoid restarting the navigation
        if (clickedAnnotations[0]) {
          this.count = currentAnnIndex - 1;
        }

        // set focused annotation to scroll in the document page
        if (
          annotations[this.count] &&
          !annotations[this.count].className.includes("label-empty")
        ) {
          this.$store.dispatch(
            "document/setDocumentFocusedAnnotation",
            this.annotations[this.count - 1]
          );
        } else {
          this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
        }

        annotations[this.count].click();
        this.count--;
      } else {
        // Check for ENTER or DELETE
        // Accept annotation
        if (event.key === "Enter") {
          const currentAnn = this.annotations.find(
            a => a.id === this.editAnnotation.id
          );

          if (this.editAnnotation.id !== currentAnn.id) return;

          this.$store.dispatch("document/setAcceptAnnotation", true);
          // set focus on next annotation
          this.count = currentAnnIndex + 1;
          this.jumpToNextAnnotation = true;
        } else if (
          event.key === "Delete" &&
          annotations[currentAnnIndex].className.includes("label-empty") &&
          annotations[currentAnnIndex].className.includes("clicked")
        ) {
          // Reject annotation
          if (this.editAnnotation.id === annotations[currentAnnIndex].id) {
            this.rejectAnnotation(
              this.editAnnotation.label,
              this.editAnnotation.labelSet
            );
          }
          this.jumpToNextAnnotation = true;
        } else {
          return;
        }
      }
    },
    labelNotRejected(label) {
      if (this.missingAnnotations.length === 0) {
        return label.id;
      } else {
        const found = this.missingAnnotations.find(l => l.label === label.id);

        if (found) {
          return 0;
        } else {
          return label.id;
        }
      }
    },

    rejectAnnotation(label, labelSet) {
      const rejected = {
        label: label,
        label_set: labelSet
      };

      this.$store.dispatch("document/setRejectAnnotation", rejected);

      this.$store
        .dispatch("document/addMissingAnnotation", rejected)
        .then(response => {
          if (response) {
            this.$store.dispatch("document/fetchMissingAnnotations");
            this.jumpToNextAnnotation = true;
          } else {
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("ann_exists")
            );
            this.jumpToNextAnnotation = false;
          }
        })
        .finally(() => {
          this.$store.dispatch("document/setRejectAnnotation", null);
        });
    }
  },
  watch: {
    editingActive(newValue) {
      if (!newValue && !this.jumpToNextAnnotation) {
        this.count = 0;
      }
    },
    acceptAnnotation(newValue, oldValue) {
      if (!newValue && oldValue) {
        this.focusOnNextAnnotation();
        this.jumpToNextAnnotation = false;
      }
    }
  }
};
</script>
