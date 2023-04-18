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
      <CategorizeModal v-if="!publicView" />
      <EmptyState />
    </div>

    <div
      v-else
      :class="[
        'annotation-set-list',
        missingAnnotations.length && !publicView && 'showing-rejected',
      ]"
    >
      <CategorizeModal v-if="!publicView" />
      <div
        v-for="(annotationSet, indexGroup) in annotationSets"
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
            <ActionButtons
              :reject-all-empty-btn="true"
              :annotation-set="annotationSet"
              :accept-all-btn="true"
              @reject-all-empty="
                rejectMissingAnnotations(null, null, annotationSet, true)
              "
              @hover-annotation-set-to-reject="
                handleHoverAnnotationSet(annotationSet, 'reject')
              "
              @leave-annotation-set-to-reject="handleHoverAnnotationSet(null)"
              @accept-group="acceptGroup(annotationSet)"
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
              @handle-reject="rejectMissingAnnotations"
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
import ActionButtons from "./ActionButtons";
import DocumentLabel from "./DocumentLabel";
import LoadingAnnotations from "./LoadingAnnotations";
import CategorizeModal from "./CategorizeModal";

/**
 * This component loads all annotations for one document
 */
export default {
  components: {
    EmptyState,
    ExtractingData,
    ActionButtons,
    DocumentLabel,
    LoadingAnnotations,
    CategorizeModal,
  },
  data() {
    return {
      count: 0,
      jumpToNextAnnotation: false,
      numberOfLoadingAnnotations: 3,
    };
  },
  computed: {
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
    ]),
    ...mapGetters("category", ["category"]),
    ...mapGetters("document", ["numberOfAnnotationSetGroup"]),
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
    showMissingAnnotations() {
      if (
        (this.publicView &&
          this.selectedDocument &&
          this.selectedDocument.is_reviewed) ||
        !this.publicView
      ) {
        return true;
      } else {
        return false;
      }
    },

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
      if (this.publicView) return;

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
          // Reject annotation
          if (this.editAnnotation.id === annotations[currentAnnIndex].id) {
            this.rejectMissingAnnotations();
          }
          this.jumpToNextAnnotation = true;
        } else {
          return;
        }
      }
    },

    rejectMissingAnnotations(label, labelSet, annotationSet, rejectAll) {
      let rejected;

      if (label && labelSet && !rejectAll) {
        // if single rejection is triggered by clicking the button

        rejected = [
          {
            document: parseInt(this.documentId),
            label: label,
            label_set: labelSet,
            annotation_set: annotationSet,
          },
        ];
      } else if (this.editAnnotation && this.editAnnotation.id !== null) {
        // if single rejection is triggered from "delete" key

        rejected = {
          document: parseInt(this.documentId),
          label: this.editAnnotation.label,
          label_set: this.editAnnotation.labelSet,
          annotation_set: this.editAnnotation.annotationSet,
        };
      } else if (annotationSet && rejectAll) {
        // reject all labels in annotation set

        const allEmptyLabels = annotationSet.labels.filter(
          (label) => label.annotations.length === 0
        );

        // Check if any of the empty annotations was already rejected individually
        // and remove them
        const toReject = [];

        allEmptyLabels.map((label) => {
          const found = this.missingAnnotations.find(
            (l) =>
              l.label === label.id &&
              l.annotation_set === annotationSet.id &&
              l.label_set === annotationSet.label_set.id
          );

          if (!found) {
            toReject.push(label);
          }
        });

        rejected = toReject.map((label) => {
          return {
            document: parseInt(this.documentId),
            label: label.id,
            label_set: annotationSet.label_set.id,
            annotation_set: annotationSet.id,
          };
        });
      }

      this.$store.dispatch("document/setRejectedMissingAnnotations", rejected);

      this.$store
        .dispatch("document/addMissingAnnotations", rejected)
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
          this.$store.dispatch("document/setRejectedMissingAnnotations", null);
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

    acceptGroup(annotationSet) {
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
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
