<template>
  <div class="labels-sidebar">
    <!-- When extracting annotations after editing -->
    <div v-if="recalculatingAnnotations">
      <ExtractingData />
    </div>

    <!-- When document data is still loading -->
    <div v-else-if="!annotationSets || loading">
      <div v-for="n in numberOfLoadingAnnotations" :key="n">
        <LoadingAnnotations />
      </div>
    </div>

    <!-- When there's no annotations in the label -->
    <div v-else-if="annotationSets.length === 0">
      <CategorizeModal
        v-if="
          !publicView &&
          !isDocumentReviewed &&
          !waitingForSplittingConfirmation(selectedDocument)
        "
      />
      <EmptyState />
    </div>

    <div v-else :class="['annotation-set-list']">
      <CategorizeModal v-if="!publicView || !isDocumentReviewed" />
      <div
        v-if="Object.entries(annotationSetsInTable()).length > 0"
        class="annotation-set-group"
      >
        <div class="label-set-header">
          <div class="label-set-name">{{ $t("table") }}</div>
        </div>
        <div
          v-for="(tableSet, index) in Object.values(annotationSetsInTable())"
          :key="index"
          class="ann-set-table"
          @click="openAnnotationSetTable(tableSet)"
        >
          <div class="ann-set-table-icon">
            <GridIcon /><span class="ann-set-number">{{
              tableSet.length
            }}</span>
          </div>
          <span class="ann-set-table-label-set-name">{{
            tableSet[0].label_set.name
          }}</span>
        </div>
      </div>
      <div
        v-for="(annotationSet, indexGroup) in annotationSetsToShowInList()"
        :key="indexGroup"
        class="annotation-set-group"
      >
        <div class="label-set-header">
          <div class="label-set-name">
            {{
              `${annotationSet.label_set.name} ${numberOfAnnotationSetGroup(
                annotationSet
              )}`
            }}
          </div>
          <div class="labelset-action-buttons">
            <AnnotationSetActionButtons
              :number-of-empty-labels-in-annotation-set="
                emptyLabelsLength(annotationSet)
              "
              :number-of-pending-annotations-in-annotation-set="
                annotationsWithPendingReviewLength(annotationSet)
              "
              @mark-all-empty-missing="
                markAnnotationsAsMissing(null, null, annotationSet, true)
              "
              @hover-annotation-set-to-mark-missing="
                handleHoverAnnotationSet(annotationSet, 'missing')
              "
              @leave-annotation-set-to-mark-missing="
                handleHoverAnnotationSet(null)
              "
              @accept-all-pending-annotations="
                acceptPendingAnnotationsInAnnotationSet(annotationSet)
              "
              @hover-annotation-set-to-accept="
                handleHoverAnnotationSet(annotationSet, 'accept')
              "
              @leave-annotation-set-to-accept="handleHoverAnnotationSet(null)"
            />
          </div>
        </div>

        <div v-for="label in annotationSet.labels" :key="label.id">
          <div class="labels">
            <DocumentLabel
              :label="label"
              :annotation-set="annotationSet"
              :index-group="indexGroup"
              @handle-missing-annotation="markAnnotationsAsMissing"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import EmptyState from "./EmptyState";
import ExtractingData from "./ExtractingData";
import AnnotationSetActionButtons from "./AnnotationSetActionButtons";
import DocumentLabel from "./DocumentLabel";
import LoadingAnnotations from "./LoadingAnnotations";
import CategorizeModal from "./CategorizeModal";
import GridIcon from "../../assets/images/GridIcon";

/**
 * This component loads all annotations for one document
 */
export default {
  components: {
    EmptyState,
    ExtractingData,
    AnnotationSetActionButtons,
    DocumentLabel,
    LoadingAnnotations,
    CategorizeModal,
    GridIcon,
  },
  data() {
    return {
      count: 0,
      jumpToNextAnnotation: false,
      numberOfLoadingAnnotations: 3,
    };
  },
  computed: {
    ...mapState("display", ["showAnnSetTable"]),
    ...mapState("document", [
      "documentId",
      "recalculatingAnnotations",
      "missingAnnotations",
      "publicView",
      "annotations",
      "editAnnotation",
      "annotationSets",
      "loading",
      "labels",
      "selectedDocument",
      "splittingSuggestions",
    ]),
    ...mapGetters("category", ["category"]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "emptyLabelsLength",
      "annotationsWithPendingReviewLength",
      "waitingForSplittingConfirmation",
      "annotationSetsToShowInList",
      "annotationSetsInTable",
      "isDocumentReviewed",
    ]),
    isAnnotationBeingEdited() {
      return this.editAnnotation && this.editAnnotation.id;
    },
  },
  watch: {
    editAnnotation(newValue) {
      if (!newValue && !this.jumpToNextAnnotation) {
        this.count = 0;
      }
    },
    acceptAnnotation(newValue, oldValue) {
      // TODO: rework this to be more generic
      if (!newValue && oldValue) {
        this.focusOnNextAnnotation();
        this.jumpToNextAnnotation = false;
      }
    },
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
        return;
      }
    },

    scrollToFocusedAnnotationFromKeyHandler() {
      if (!this.editAnnotation) return;

      // Get label name for the selected annotation
      let labelForAnnotation;

      this.labels.map((label) => {
        const found = label.annotations.find(
          (ann) => ann.id === this.editAnnotation.id
        );

        if (found) {
          labelForAnnotation = label;
          return;
        }
      });

      const currentAnnotation = this.annotations.find(
        (ann) => ann.id === this.editAnnotation.id
      );

      if (currentAnnotation) {
        this.$store.dispatch("document/setDocumentAnnotationSelected", {
          annotation: currentAnnotation,
          label: labelForAnnotation,
          span: currentAnnotation.span[0],
          scrollTo: false,
        });

        this.$store.dispatch("document/scrollToDocumentAnnotationSelected");
      }
    },

    keyDownHandler(event) {
      // only allow keyboard navigation if we are not in public view mode
      if (this.publicView || this.isDocumentReviewed) return;

      // get out of edit mode and navigation
      if (event.key === "Escape") {
        this.count = 0;
        this.$store.dispatch("document/resetEditAnnotation");
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("document/endLoading");
        return;
      }

      // Not allow starting edit mode with ArrowUp key
      if (event.key === "ArrowUp" && !this.isAnnotationBeingEdited) return;

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
        (el) => el === clickedAnnotations[0]
      );

      // navigate with the arrow up or down keys
      if (event.key === "ArrowDown") {
        if (this.count >= annotations.length) {
          const finishBtn = Array.from(
            document.getElementsByClassName("finish-review-btn")
          );
          finishBtn[0].focus();
          this.$store.dispatch("document/resetEditAnnotation");
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

        // Skip missing annotations
        if (this.focusedAnnotationIsMarkedAsMissing(annotations, this.count)) {
          for (let i = this.count; i < annotations.length; i++) {
            if (!this.focusedAnnotationIsMarkedAsMissing(annotations, i)) {
              break;
            }
            this.count++;
          }
        }

        if (!annotations[this.count]) return;

        annotations[this.count].click();

        // scroll to current annotation if not empty
        this.scrollToFocusedAnnotationFromKeyHandler();

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

        // Skip missing annotations
        if (this.focusedAnnotationIsMarkedAsMissing(annotations, this.count)) {
          for (let i = this.count; i < annotations.length; i--) {
            if (!this.focusedAnnotationIsMarkedAsMissing(annotations, i)) {
              break;
            }
            this.count--;
          }
        }

        if (!annotations[this.count]) return;

        annotations[this.count].click();

        // scroll to current annotation if not empty
        this.scrollToFocusedAnnotationFromKeyHandler();

        this.count--;
      } else {
        // Check for ENTER or DELETE
        // Accept annotation
        if (event.key === "Enter") {
          if (!this.annotations || !this.editAnnotation) return;

          const currentAnn = this.annotations.find(
            (a) => a.id === this.editAnnotation.id
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
          // Mark annotation as missing
          if (this.editAnnotation.id === annotations[currentAnnIndex].id) {
            this.markAnnotationsAsMissing();
          }
          this.jumpToNextAnnotation = true;
        } else {
          return;
        }
      }
    },

    focusedAnnotationIsMarkedAsMissing(annotations, index) {
      return annotations[index].classList.value.includes("missing-annotation");
    },

    markAnnotationsAsMissing(label, labelSet, annotationSet, markAllMissing) {
      let missing;

      if (label && labelSet && !markAllMissing) {
        // if annotation is marked as missing by clicking the button

        missing = [
          {
            document: parseInt(this.documentId),
            label: label,
            label_set: labelSet,
            annotation_set: annotationSet,
          },
        ];
      } else if (this.editAnnotation && this.editAnnotation.id !== null) {
        // if annotation is marked as missing from "delete" key

        missing = [
          {
            document: parseInt(this.documentId),
            label: this.editAnnotation.label,
            label_set: this.editAnnotation.labelSet,
            annotation_set: this.editAnnotation.annotationSet,
          },
        ];
      } else if (annotationSet && markAllMissing) {
        // mark all annotations as missing in annotation set

        const allEmptyLabels = annotationSet.labels.filter(
          (label) => label.annotations.length === 0
        );

        // Check if any of the empty annotations was already marked as missing individually
        // and remove them
        const toMarkAsMissing = [];

        allEmptyLabels.map((label) => {
          const found = this.missingAnnotations.find(
            (l) =>
              l.label === label.id &&
              l.annotation_set === annotationSet.id &&
              l.label_set === annotationSet.label_set.id
          );

          if (!found) {
            toMarkAsMissing.push(label);
          }
        });

        missing = toMarkAsMissing.map((label) => {
          return {
            document: parseInt(this.documentId),
            label: label.id,
            label_set: annotationSet.label_set.id,
            annotation_set: annotationSet.id,
          };
        });
      }

      this.$store.dispatch("document/setAnnotationsMarkedAsMissing", missing);

      this.$store
        .dispatch("document/addMissingAnnotations", missing)
        .then((response) => {
          if (response) {
            this.jumpToNextAnnotation = true;
          }

          this.jumpToNextAnnotation = false;
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        })
        .finally(() => {
          this.$store.dispatch("document/setAnnotationsMarkedAsMissing", null);
          this.$store.dispatch("document/resetEditAnnotation");
          this.$store.dispatch("selection/disableSelection");
        });
    },

    handleHoverAnnotationSet(annotationSet, type) {
      let hovered;

      if (!type && !annotationSet) {
        hovered = null;
      } else {
        hovered = {
          annotationSet: annotationSet,
          type: type,
        };
      }

      this.$store.dispatch("document/setHoveredAnnotationSet", hovered);
    },

    acceptPendingAnnotationsInAnnotationSet(annotationSet) {
      const annotationsToAccept = [];

      annotationSet.labels.map((label) => {
        if (label.annotations.length !== 0) {
          label.annotations.map((ann) => {
            if (!ann.revised) {
              annotationsToAccept.push(ann.id);
            }
          });
        }
      });

      if (annotationsToAccept.length !== 0) {
        const acceptedAnnotations = {
          ids: annotationsToAccept,
          is_correct: true,
          revised: true,
        };

        this.$store
          .dispatch("document/updateMultipleAnnotations", acceptedAnnotations)
          .catch((error) => {
            this.$store.dispatch("document/createErrorMessage", {
              error,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          });
      }
    },

    openAnnotationSetTable(tableSet) {
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("document/resetEditAnnotation");
      if (this.showAnnSetTable && this.showAnnSetTable === tableSet) {
        this.$store.dispatch("display/toggleAnnSetTable", tableSet);
      } else {
        this.$store.dispatch("display/showAnnSetTable", tableSet);
      }
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
