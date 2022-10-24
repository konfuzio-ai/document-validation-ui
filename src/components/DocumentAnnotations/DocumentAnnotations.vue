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
    <div
      v-else-if="!sidebarAnnotationSets || sidebarAnnotationSets.length === 0"
    >
      <EmptyState />
    </div>

    <div
      v-else
      :class="['labels-list', missingAnnotations.length && 'showing-rejected']"
    >
      <CategorizeModal
        :show="showCategorizeModal"
        :document="selectedDocument"
      />
      <div
        v-for="(annotationSet, indexGroup) in sidebarAnnotationSets"
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
          <div
            class="labels"
            v-if="labelNotRejected(label, annotationSet.label_set)"
          >
            <div v-if="labelHasAnnotations(label)">
              <!-- Label Annotations -->
              <Label
                v-for="annotation in label.annotations"
                :key="annotationId(annotationSet, label, annotation)"
                :label="label"
                :annotationSet="annotationSet"
                :annotation="annotation"
                :editing="
                  isAnnotationInEditMode(
                    annotationId(annotationSet, label, annotation)
                  )
                "
                :indexGroup="indexGroup"
                @handle-scroll="handleScroll"
                @handle-reject="rejectAnnotation"
              >
                <!-- Label Grouped Annotations -->
                <template v-slot:groupedAnnotations>
                  <Label
                    v-for="groupedAnnotation in annotation.groupedAnnotations"
                    :key="annotationId(annotationSet, label, groupedAnnotation)"
                    :label="label"
                    :annotationSet="annotationSet"
                    :annotation="groupedAnnotation"
                    :editing="
                      isAnnotationInEditMode(
                        annotationId(annotationSet, label, groupedAnnotation)
                      )
                    "
                    :indexGroup="indexGroup"
                    :parentGroupAnnotation="annotation"
                    @handle-scroll="handleScroll"
                    @handle-reject="rejectAnnotation"
                  />
                </template>
              </Label>
            </div>
            <div v-else>
              <!-- Empty Label -->
              <Label
                :label="label"
                :annotationSet="annotationSet"
                :editing="
                  isAnnotationInEditMode(
                    annotationId(annotationSet, label, null)
                  )
                "
                :indexGroup="indexGroup"
                @handle-reject="rejectAnnotation"
              />
            </div>
          </div>
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
import ActionButtons from "./ActionButtons";
import Label from "./Label";
import RejectedLabels from "./RejectedLabels";
import LoadingAnnotations from "./LoadingAnnotations";
import AnnotationsTopBar from "./AnnotationsTopBar";
import CategorizeModal from "./CategorizeModal";

/**
 * This component loads all annotations for one document
 */
export default {
  components: {
    EmptyState,
    ExtractingData,
    ActionButtons,
    Label,
    RejectedLabels,
    LoadingAnnotations,
    AnnotationsTopBar,
    CategorizeModal
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
      numberOfLoadingAnnotations: 3,
      showCategorizeModal: true
    };
  },
  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "missingAnnotations",
      "publicView",
      "editingActive",
      "annotations",
      "editAnnotation",
      "imageLoaded",
      "acceptAnnotation",
      "sidebarAnnotationSelected",
      "sidebarAnnotationSets",
      "selectedDocument"
    ]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "labelHasAnnotations",
      "isAnnotationInEditMode"
    ])
  },
  created() {
    window.addEventListener("keydown", this.keyDownHandler);
  },
  destroyed() {
    window.removeEventListener("keydown", this.keyDownHandler);
  },
  methods: {
    annotationId(annotationSet, label, annotation) {
      if (!annotationSet || !label) return;

      let emptyAnnotationId;

      if (annotationSet.id) {
        emptyAnnotationId = `${annotationSet.id}_${label.id}`;
      } else {
        emptyAnnotationId = `${annotationSet.label_set.id}_${label.id}`;
      }

      return annotation ? annotation.id : emptyAnnotationId;
    },
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
      // only allow keyboard navigation if we are not in public view mode
      if (this.publicView) return;

      // get out of edit mode and navigation
      if (event.key === "Escape") {
        this.count = 0;
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

        annotations[this.count].click();
        this.count--;
      } else {
        // Check for ENTER or DELETE
        // Accept annotation
        if (event.key === "Enter") {
          const currentAnn = this.annotations.find(
            a => a.id === this.editAnnotation.id
          );

          if (!this.editAnnotation && this.editAnnotation.id !== currentAnn.id)
            return;
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
    labelNotRejected(label, labelSet) {
      // Check if the combined label and label set have been rejected
      if (this.missingAnnotations.length === 0) {
        return true;
      } else {
        const found = this.missingAnnotations.filter(
          el => el.label === label.id && el.label_set === labelSet.id
        );

        if (found.length !== 0) {
          return false;
        } else {
          return true;
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
