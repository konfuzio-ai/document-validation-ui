<template>
  <div id="document-annotations" @click="cleanSelection">
    <!-- When extracting annotations after editing -->
    <div v-if="recalculatingAnnotations" class="extracting-data">
      <ExtractingData />
    </div>

    <!-- When document data is still loading -->
    <div
      v-else-if="!getAnnotationsFiltered.annotationSets || loading"
      class="document-annotations-loading"
    >
      <div
        v-for="n in numberOfLoadingAnnotations"
        :key="n"
        class="loading-annotation-set"
      >
        <LoadingAnnotations />
      </div>
    </div>
    <div
      v-else-if="
        getAnnotationsFiltered.annotationSets.length === 0 &&
        !isSearchingAnnotationList
      "
      class="empty-annotation-sets"
    >
      <EmptyState />
    </div>

    <div v-else ref="annotationList" class="annotation-set-list">
      <AnnotationFilters
        v-if="isDocumentEditable"
        @openAll="openAllAccordions"
      />

      <div
        v-if="
          getAnnotationsFiltered.annotationSets.length === 0 &&
          isSearchingAnnotationList
        "
        class="empty-annotation-sets"
      >
        <EmptyState :is-search="true" />
      </div>
      <div v-if="annotationSetsAccordion" class="annotation-sets-accordions">
        <div
          v-for="(
            annotationSet, indexGroup
          ) in getAnnotationsFiltered.annotationSets"
          :key="indexGroup"
          :class="[
            'annotation-set-group',
            indexGroup === 0 && 'no-top-margin',
            !isAccordionOpen(annotationSet) && 'annotation-set-collapsed',
          ]"
        >
          <div class="label-set-header" @click="toggleAccordion(annotationSet)">
            <div class="label-set-name">
              <b-icon
                :icon="
                  isAccordionOpen(annotationSet) ? 'angle-up' : 'angle-down'
                "
                size="is-12"
              />
              {{
                `${annotationSet.label_set.name} ${numberOfAnnotationSetGroup(
                  annotationSet
                )}`
              }}
            </div>
            <div
              v-if="
                !publicView &&
                !isDocumentReviewed &&
                annotationSet.labels.length !== 0
              "
              class="labelset-action-buttons"
            >
              <AnnotationSetActionButtons
                :is-placeholder="!isAccordionOpen(annotationSet)"
                :number-of-empty-labels-in-annotation-set="
                  emptyLabels(annotationSet).length
                "
                :number-of-not-correct-annotations-in-annotation-set="
                  notCorrectAnnotations(annotationSet).length
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

          <b-collapse
            :model-value="isAccordionOpen(annotationSet)"
            animation="slide"
          >
            <div
              v-if="annotationSet.labels.length > 0"
              class="annotation-sets-list"
            >
              <div v-for="label in annotationSet.labels" :key="label.id">
                <div
                  v-if="!(label.annotations.length === 0 && publicView)"
                  class="labels"
                >
                  <DocumentLabel
                    :label="label"
                    :annotation-set="annotationSet"
                    :label-set="annotationSet.label_set"
                    :index-group="indexGroup"
                    @handle-missing-annotation="markAnnotationsAsMissing"
                  />
                </div>
              </div>
            </div>

            <div
              v-else-if="annotationSet.labels.length === 0"
              class="no-labels"
            >
              <span>
                {{
                  isSearchingAnnotationList
                    ? $t("no_results")
                    : $t("no_labels_in_set")
                }}</span
              >
              <!-- eslint-disable vue/no-v-html -->
              <span
                v-if="
                  showBranding &&
                  isDocumentEditable &&
                  !isSearchingAnnotationList
                "
                v-html="$t('link_to_add_labels')"
              />
            </div>

            <div
              v-else-if="
                !annotationSetHasAnnotations(annotationSet) && publicView
              "
              class="no-labels"
            >
              <span> {{ $t("no_annotations_in_annotation_set") }}</span>
            </div>
          </b-collapse>
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
import AnnotationFilters from "./AnnotationFilters";
import LoadingAnnotations from "./LoadingAnnotations";

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
    AnnotationFilters,
  },
  data() {
    return {
      count: 0,
      jumpToNextAnnotation: false,
      numberOfLoadingAnnotations: 3,
      annotationSetsAccordion: null,
    };
  },

  computed: {
    ...mapState("display", ["showAnnSetTable", "showBranding"]),
    ...mapState("edit", ["editMode"]),
    ...mapState("document", [
      "annotationSets",
      "documentId",
      "annotationId",
      "annotationSetId",
      "recalculatingAnnotations",
      "publicView",
      "editAnnotation",
      "loading",
      "labels",
      "selectedDocument",
      "splittingSuggestions",
    ]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "getAnnotationsFiltered",
      "emptyLabels",
      "notCorrectAnnotations",
      "isDocumentReviewed",
      "annotationSetOfAnnotation",
      "isAnnotationInAnnotationSet",
      "isSearchingAnnotationList",
    ]),
    isAnnotationBeingEdited() {
      return this.editAnnotation && this.editAnnotation.id;
    },
    isDocumentEditable() {
      return !this.publicView && !this.isDocumentReviewed && !this.editMode;
    },
  },
  watch: {
    editAnnotation(newValue) {
      if (!newValue && !this.jumpToNextAnnotation) {
        this.count = 0;
      }
    },
    acceptAnnotation(newValue, oldValue) {
      if (!newValue && oldValue) {
        this.focusOnNextAnnotation();
        this.jumpToNextAnnotation = false;
      }
    },
    getAnnotationsFiltered(newFiltered, oldFiltered) {
      // just load accordions again if the length was changed
      if (
        newFiltered.annotationSets.length !== oldFiltered.annotationSets.length
      ) {
        this.loadAccordions(
          newFiltered.annotationSets,
          oldFiltered.annotationSets
        );
      }
    },
    annotationId(newAnnotationId) {
      if (newAnnotationId) {
        const annotationSet = this.annotationSetOfAnnotation(newAnnotationId);
        if (annotationSet) {
          const newAnnotationSetsAccordion = {
            ...this.annotationSetsAccordion,
          };
          newAnnotationSetsAccordion[
            annotationSet.id || annotationSet.label_set.id
          ] = true;
          this.annotationSetsAccordion = newAnnotationSetsAccordion;
        }
      }
    },
  },
  created() {
    window.addEventListener("keydown", this.keyDownHandler);

    // validation for when page is hot reloaded and data reinitialize
    if (
      this.getAnnotationsFiltered.annotationSets &&
      this.getAnnotationsFiltered.annotationSets.length > 0
    ) {
      this.loadAccordions(this.getAnnotationsFiltered.annotationSets);
    }
  },
  unmounted() {
    window.removeEventListener("keydown", this.keyDownHandler);
  },
  methods: {
    annotationSetShouldAppear(annotationSet) {
      return !(
        annotationSet.labels.length === 0 && this.isSearchingAnnotationList
      );
    },
    isAccordionOpen(annotationSet) {
      return (
        this.isSearchingAnnotationList ||
        this.annotationSetsAccordion[
          annotationSet.id || annotationSet.label_set.id
        ] === true
      );
    },
    toggleAccordion(annotationSet) {
      const newAnnotationSetsAccordion = { ...this.annotationSetsAccordion };
      newAnnotationSetsAccordion[
        annotationSet.id || annotationSet.label_set.id
      ] =
        !newAnnotationSetsAccordion[
          annotationSet.id || annotationSet.label_set.id
        ];
      this.annotationSetsAccordion = newAnnotationSetsAccordion;
    },
    openAllAccordions() {
      const newAnnotationSetsAccordion = { ...this.annotationSetsAccordion };
      for (var key in newAnnotationSetsAccordion) {
        newAnnotationSetsAccordion[key] = true;
      }
      this.annotationSetsAccordion = newAnnotationSetsAccordion;
    },
    loadAccordions(newAnnotationSets) {
      if (newAnnotationSets) {
        const isFirstTime = this.annotationSetsAccordion === null;
        const newAnnotationSetsAccordion = {};
        const annotationSetsCreated = [];

        newAnnotationSets.forEach((newAnnotationSet, index) => {
          if (isFirstTime && this.annotationSetId) {
            newAnnotationSetsAccordion[
              newAnnotationSet.id || newAnnotationSet.label_set.id
            ] = newAnnotationSet.id == this.annotationSetId;
          } else if (isFirstTime && this.annotationId) {
            newAnnotationSetsAccordion[
              newAnnotationSet.id || newAnnotationSet.label_set.id
            ] = this.isAnnotationInAnnotationSet(
              newAnnotationSet,
              this.annotationId
            );
          } else if (isFirstTime && index === 0) {
            // open first one by default
            newAnnotationSetsAccordion[
              newAnnotationSet.id || newAnnotationSet.label_set.id
            ] = true;
          } else {
            const wasCreated = annotationSetsCreated.find(
              (annotationSetCreated) =>
                annotationSetCreated.id &&
                newAnnotationSet.id &&
                newAnnotationSet.id === annotationSetCreated.id
            );
            newAnnotationSetsAccordion[
              newAnnotationSet.id || newAnnotationSet.label_set.id
            ] = wasCreated !== undefined;
          }
        });
        this.annotationSetsAccordion = newAnnotationSetsAccordion;
      }
    },
    annotationSetHasAnnotations(annotationSet) {
      const found = annotationSet.labels.find(
        (label) => label.annotations.length > 0
      );
      return found;
    },

    focusOnNextAnnotation() {
      const annotations = this.createArray("keyboard-nav");

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

      const currentAnnotation = this.getAnnotationsFiltered.annotations.find(
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

    exitEditMode() {
      this.count = 0;
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("document/endLoading");
    },

    createArray(className) {
      if (this.$refs.annotationList) {
        return Array.from(
          this.$refs.annotationList.getElementsByClassName(className)
        );
      }
    },

    keyDownHandler(event) {
      // only allow keyboard navigation if we are not in public view mode
      if (!this.isDocumentEditable) return;

      // Exit edit mode and navigation
      if (event.key === "Escape") {
        this.exitEditMode();
        return;
      }

      // Not allow starting edit mode with ArrowUp key
      if (event.key === "ArrowUp" && !this.isAnnotationBeingEdited) return;

      // Get all the annotation elements
      let annotations = this.createArray("keyboard-nav");

      // Get clicked element to get the index
      const clickedAnnotations = this.createArray("clicked-ann");

      // get index of currently active element
      const currentAnnIndex = annotations.findIndex(
        (el) => el === clickedAnnotations[0]
      );

      // navigate with the arrow up or down keys
      if (event.key === "ArrowDown") {
        // open accordions
        this.openAllAccordions();

        // Check if we are focusing on the Finish Review button
        if (this.count >= annotations.length) {
          const finishBtn = this.createArray("finish-review-btn");

          if (finishBtn && finishBtn[0]) {
            finishBtn[0].focus();
          }
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

        const nextElement = annotations[this.count];
        if (nextElement.className.includes("label-group")) {
          // open group and then click on annotation
          // index is the same since group is removed from keyboard nav
          nextElement.click();
          this.$nextTick(() => {
            annotations = this.createArray("keyboard-nav");
            annotations[this.count].click();
            this.scrollToFocusedAnnotationFromKeyHandler();
            this.count++;
          });
        } else if (annotations[this.count]) {
          annotations[this.count].click();
          this.scrollToFocusedAnnotationFromKeyHandler();
          this.count++;
        }

        // scroll to current annotation if not empty
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

        const previousElement = annotations[this.count];
        if (previousElement.className.includes("label-group")) {
          // open group and then click on annotation
          // index is the same since group is removed from keyboard nav
          previousElement.click();
          this.$nextTick(() => {
            annotations = this.createArray("keyboard-nav");
            // since we are going backwards, we need to go to the last annotation of group
            const currentAnnIndex = annotations.findIndex(
              (el) => el === clickedAnnotations[0]
            );
            this.count = currentAnnIndex - 1;
            annotations[this.count].click();
            this.scrollToFocusedAnnotationFromKeyHandler();
            this.count--;
          });
        } else if (annotations[this.count]) {
          annotations[this.count].click();
          this.scrollToFocusedAnnotationFromKeyHandler();
          this.count--;
        }
      } else {
        // Check for ENTER or DELETE
        // Accept annotation
        if (event.key === "Enter") {
          if (!this.getAnnotationsFiltered.annotations || !this.editAnnotation)
            return;

          const currentAnn = this.getAnnotationsFiltered.annotations.find(
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
      } else if (
        this.editAnnotation &&
        this.editAnnotation.id !== null &&
        this.editAnnotation.annotationSet
      ) {
        // if annotation is marked as missing from "delete" key

        missing = [
          {
            document: parseInt(this.documentId),
            label: this.editAnnotation.label.id,
            label_set: this.editAnnotation.labelSet.id,
            annotation_set: this.editAnnotation.annotationSet.id,
          },
        ];
      } else if (annotationSet && markAllMissing) {
        // mark all annotations as missing in annotation set

        // Check if any of the empty annotations was already marked as missing individually
        // and remove them
        const toMarkAsMissing = this.emptyLabels(annotationSet);

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
    cleanSelection() {
      this.$store.dispatch("document/setAnnotationId", null);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
