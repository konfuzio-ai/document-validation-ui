import myImports from "../api";
import {
  sleep,
  getURLQueryParam,
  navigateToNewDocumentURL,
  getURLPath,
  setURLAnnotationHash,
  setURLQueryParam,
  debounce,
} from "../utils/utils";

const HTTP = myImports.HTTP;
const documentPollDuration = 1000;
export const table_reference_api = "api.v3.dvui.table";

const state = {
  loading: true,
  pages: [],
  annotationSets: null,
  annotations: null,
  labels: [],
  documentId: process.env.VUE_APP_DOCUMENT,
  annotationId: null,
  annotationSetId: null,
  documentAnnotationSelected: null,
  selectedDocument: null,
  recalculatingAnnotations: false,
  editAnnotation: null,
  missingAnnotations: [],
  publicView: true,
  showActionError: false,
  errorMessage: null,
  showDocumentError: false,
  annotationsMarkedAsMissing: null,
  errorMessageWidth: null,
  hoveredAnnotationSet: null,
  newAcceptedAnnotations: null,
  serverError: false,
  splittingSuggestions: null,
  enableGroupingFeature: true,
  annotationFilters: {
    showFeedbackNeeded:
      window.location.hash === "#unrevised" ||
      window.location.hash === "#possiblyIncorrect" ||
      true,
    showEmpty:
      window.location.hash === "#unrevised" ||
      window.location.hash === "#possiblyIncorrect"
        ? false
        : true,
    showAccepted:
      window.location.hash === "#unrevised" ||
      window.location.hash === "#possiblyIncorrect"
        ? false
        : true,
  },
  annotationSearch:
    (getURLQueryParam("search") && getURLQueryParam("search").split(",")) || [],
};
const getters = {
  /**
   * Number of pages. If the pages array doesn't exist yet, return 0.
   */
  pageCount: (state) => {
    if (state.selectedDocument.pages) {
      return state.selectedDocument.pages.length;
    }
    return 0;
  },

  /**
   * Returns the current page
   */
  pageSelected: (state, _, rootState) => {
    if (state.pages) {
      return state.pages[rootState.display.currentPage - 1];
    }
    return null;
  },

  /**
   * Returns a page in the given index
   */
  pageAtIndex: (state) => (index) => {
    if (state.selectedDocument && state.selectedDocument.pages) {
      return state.selectedDocument.pages[index];
    }
    return null;
  },

  /**
   * Checks if is to scroll to an annotation in the document
   */
  scrollDocumentToAnnotation: (state) => {
    return (
      state.documentAnnotationSelected &&
      state.documentAnnotationSelected.scrollTo
    );
  },

  /**
   * Checks if the document is categorized and ready to start the review
   */
  categorizationIsConfirmed: (state) => {
    if (state.selectedDocument) {
      if (
        state.selectedDocument.category_is_revised ||
        state.selectedDocument.is_reviewed
      ) {
        return true;
      } else if (!state.selectedDocument.category) {
        return false;
      } else {
        // check if there's any annotation already approved
        const found = state.annotations.find((annotation) => {
          return annotation.revised;
        });
        return found != undefined;
      }
    }
    return false;
  },

  /**
   * Gets labels for an annotation creation from a label/annotation set
   */
  labelsFilteredForAnnotationCreation: (_, getters) => (set) => {
    let availableLabels = [];
    if (set.id && set.labels) {
      // check if label can be multiple, if there's already an annotation created & if it's a negative annotation
      set.labels.map((label) => {
        // check if we already added the same label to the array
        const found = availableLabels.find((l) => l.id === label.id);

        if (found) return;

        if (label.annotations.length === 0) {
          availableLabels.push(label);
        } else {
          if (label.has_multiple_top_candidates) {
            availableLabels.push(label);
          } else {
            // if the label has negative annotations, we show the label
            label.annotations.map((annotation) => {
              if (getters.isNegative(annotation)) {
                availableLabels.push(label);
              }
            });
          }
        }
      });
    } else if (set.labels) {
      // if not existing ann set, then return all labels
      availableLabels = set.labels;
    }
    return availableLabels;
  },

  /* Checks if annotation is in deleted state */
  isAnnotationDeleted: (state) => (annotation) => {
    if (annotation) {
      return annotation.revised && !annotation.is_correct;
    }
    return false;
  },

  /* Checks if the label has annotations to show */
  labelHasAnnotations: (_, getters) => (label) => {
    const annotations = label.annotations.filter((annotation) => {
      return !getters.isAnnotationDeleted(annotation);
    });
    return annotations.length > 0;
  },

  /* Checks if the document has an annotation set */
  annotationSetExists: (state) => (annotationSetId) => {
    return state.annotationSets.find((annSet) => annSet.id === annotationSetId);
  },

  /* Get annotation sets created in table */
  annotationSetsInTable: (state) => () => {
    const annotationSetsList = {};
    state.annotationSets.forEach((annotationSet) => {
      let addAnnotationSet = false;
      if (annotationSet.labels) {
        annotationSet.labels.forEach((label) => {
          if (
            label.annotations &&
            label.annotations.find(
              (annotation) =>
                annotation.origin && annotation.origin === table_reference_api
            )
          ) {
            addAnnotationSet = true;
            return;
          }
        });
      }
      if (addAnnotationSet) {
        // group by label set
        if (annotationSetsList[`${annotationSet.label_set.id}`]) {
          annotationSetsList[`${annotationSet.label_set.id}`].push(
            annotationSet
          );
        } else {
          annotationSetsList[`${annotationSet.label_set.id}`] = [annotationSet];
        }
      }
    });

    return annotationSetsList;
  },

  /* Get annotation sets */
  annotationSetsToShowInList: (state) => () => {
    const annotationSetsList = [];
    state.annotationSets.forEach((annotationSet) => {
      let addAnnotationSet = true;
      if (annotationSet.labels) {
        annotationSet.labels.forEach((label) => {
          if (
            label.annotations &&
            label.annotations.find(
              (annotation) =>
                annotation.origin && annotation.origin === table_reference_api
            )
          ) {
            addAnnotationSet = false;
            return;
          }
        });
      }
      if (addAnnotationSet) {
        annotationSetsList.push(annotationSet);
      }
    });
    return annotationSetsList;
  },

  /* Get annotations inside a list of annotation sets */
  annotationsInAnnotationsSets: (state) => (annotationsSets) => {
    const annotations = [];
    annotationsSets.forEach((annotationSet) => {
      annotationSet.labels.forEach((label) => {
        label.annotations.forEach((annotation) => {
          annotations.push(annotation);
        });
      });
    });
    return annotations;
  },

  /* Get annotation set for a given annotation */
  annotationSetOfAnnotation: (state) => (annotationIdToFind) => {
    let foundAnnotationSet = null;
    state.annotationSets.forEach((annotationSet) => {
      annotationSet.labels.forEach((label) => {
        label.annotations.forEach((annotation) => {
          if (annotation.id === annotationIdToFind) {
            foundAnnotationSet = annotationSet;
            return;
          }
        });
        if (foundAnnotationSet) {
          return;
        }
      });
      if (foundAnnotationSet) {
        return;
      }
    });
    return foundAnnotationSet;
  },

  /* Get label for a given annotation */
  labelOfAnnotation: (state) => (annotationToFind) => {
    let foundLabel = null;
    state.annotationSets.forEach((annotationSet) => {
      annotationSet.labels.forEach((label) => {
        label.annotations.forEach((annotation) => {
          if (annotation.id === annotationToFind.id) {
            foundLabel = label;
            return;
          }
        });
        if (foundLabel) {
          return;
        }
      });
      if (foundLabel) {
        return;
      }
    });
    return foundLabel;
  },

  getAnnotationsFiltered: (state) => {
    // group annotations for sidebar
    let annotations = [];
    let labels = [];
    let processedAnnotationSets = [];
    let processedLabels = [];

    // search feature
    const addAnnotation = (listToAdd, annotation, force) => {
      if (force) {
        listToAdd.push(annotation);
        return true;
      }
      if (state.annotationSearch.length > 0) {
        if (
          annotation.offset_string &&
          state.annotationSearch.find((search) =>
            annotation.offset_string
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        ) {
          listToAdd.push(annotation);
          return true;
        } else if (
          annotation.id &&
          state.annotationSearch.find((search) => `${annotation.id}` === search)
        ) {
          listToAdd.push(annotation);
          return true;
        }
      } else {
        listToAdd.push(annotation);
        return true;
      }
      return false;
    };

    const labelHasSearchText = (label) => {
      if (state.annotationSearch.length > 0) {
        if (
          label.name &&
          state.annotationSearch.find((search) =>
            label.name.toLowerCase().includes(search.toLowerCase())
          )
        ) {
          return true;
        }
      } else {
        return false;
      }
      return false;
    };

    if (state.annotationSets) {
      state.annotationSets.forEach((annotationSet) => {
        labels = [];
        annotationSet.labels.forEach((label) => {
          const labelAnnotations = [];
          let addLabel = false;
          const labelHasSearch = labelHasSearchText(label);
          if (
            !state.annotationFilters.showEmpty ||
            !state.annotationFilters.showFeedbackNeeded ||
            !state.annotationFilters.showAccepted
          ) {
            if (!label.annotations || label.annotations.length === 0) {
              if (state.annotationFilters.showEmpty) {
                addLabel = true;
              }
            } else {
              label.annotations.forEach((annotation) => {
                if (
                  state.annotationFilters.showFeedbackNeeded &&
                  annotation.revised === false &&
                  !annotation.created_by
                ) {
                  const added = addAnnotation(
                    labelAnnotations,
                    annotation,
                    labelHasSearch
                  );
                  if (added) {
                    addLabel = true;
                  }
                } else if (
                  state.annotationFilters.showAccepted &&
                  (annotation.revised === true || annotation.created_by)
                ) {
                  const added = addAnnotation(
                    labelAnnotations,
                    annotation,
                    labelHasSearch
                  );
                  if (added) {
                    addLabel = true;
                  }
                }
              });
            }
          } else {
            // add annotations to the document array
            label.annotations.forEach((annotation) => {
              const added = addAnnotation(
                labelAnnotations,
                annotation,
                labelHasSearch
              );
              if (added) {
                addLabel = true;
              }
            });
          }
          if (addLabel) {
            labels.push({ ...label, annotations: labelAnnotations });
            processedLabels.push(label);
          }
          annotations.push(...labelAnnotations);
        });

        // if in search do not add the annotation set
        if (!(state.annotationSearch.length > 0 && labels.length === 0)) {
          processedAnnotationSets.push({ ...annotationSet, labels });
        }
      });
    }

    return {
      annotationSets: processedAnnotationSets,
      labels: processedLabels,
      annotations,
    };
  },

  /* Process annotations and extract labels and sets */
  processAnnotationSets: () => (annotationSets) => {
    // group annotations for sidebar
    let annotations = [];
    let labels = [];
    let processedAnnotationSets = [];
    let processedLabels = [];

    annotationSets.forEach((annotationSet) => {
      if (annotationSet.id) {
        labels = [];
        annotationSet.labels.forEach((label) => {
          const labelAnnotations = [];

          // add annotations to the document array
          labelAnnotations.push(...label.annotations);
          labels.push({ ...label, annotations: labelAnnotations });
          processedLabels.push(label);
          annotations.push(...labelAnnotations);
        });
        processedAnnotationSets.push({ ...annotationSet, labels });
      }
    });
    return {
      annotationSets: processedAnnotationSets,
      labels: processedLabels,
      annotations,
    };
  },

  /* Checks if there are annotations correct in the document */
  documentHasCorrectAnnotations: (state) => {
    if (
      !state.annotations ||
      (state.annotations &&
        state.annotations.filter((ann) => ann.is_correct).length > 0)
    ) {
      return true;
    }
    return false;
  },

  /* Returns the number of accepted annotations in a label */
  numberOfAcceptedAnnotationsInLabel: (_) => (label) => {
    const annotations = label.annotations.filter((annotation) => {
      return annotation.revised && annotation.is_correct;
    });
    return annotations.length;
  },

  /**
   * Checks if theres a group of annotation sets and add an index number to them
   */
  numberOfAnnotationSetGroup: (state) => (annotationSet) => {
    let found = false;
    let value = 0;
    let index = 0;
    if (state.annotationSets) {
      let orderedAnnotationSets = [...state.annotationSets];
      orderedAnnotationSets.sort((a, b) => {
        return a.id - b.id || a.label_set.name.localeCompare(b.label_set.name);
      });
      orderedAnnotationSets.map((annotationSetTemp) => {
        if (
          annotationSetTemp.id !== annotationSet.id &&
          annotationSetTemp.label_set.id === annotationSet.label_set.id &&
          annotationSetTemp.label_set.name === annotationSet.label_set.name
        ) {
          found = true;
          index++;
        } else if (
          annotationSetTemp.label_set.id === annotationSet.label_set.id
        ) {
          value = index;
        }
      });
      return found ? `${value + 1}` : "";
    }
    return "";
  },

  /**
   * Checks if theres a group of annotation sets with this label set
   */
  numberOfLabelSetGroup: (state) => (labelSet) => {
    let found = false;
    let index = 0;
    if (state.annotationSets) {
      let orderedAnnotationSets = [...state.annotationSets];
      orderedAnnotationSets.sort((a, b) => {
        return a.id - b.id || a.label_set.name.localeCompare(b.label_set.name);
      });
      orderedAnnotationSets.map((annotationSetTemp) => {
        if (
          annotationSetTemp.label_set.id === labelSet.id &&
          annotationSetTemp.label_set.name === labelSet.name
        ) {
          found = true;
          index++;
        }
      });
      return found ? `${index + 1}` : "";
    }
    return "";
  },

  /**
   * Get label with annotations filtered if the label supports multiple or not
   */
  annotationsInLabelFiltered: (state) => (label) => {
    let labelToReturn;
    if (
      label.has_multiple_top_candidates === false &&
      label.annotations &&
      label.annotations.length > 1
    ) {
      let highestConfidenceAnnotation = label.annotations[0];
      for (let i = 1; i < label.annotations.length; i++) {
        // check which one has more confidence or if it's the same, then check if one is revised or not
        if (
          highestConfidenceAnnotation.confidence <
            label.annotations[i].confidence ||
          (highestConfidenceAnnotation.confidence ===
            label.annotations[i].confidence &&
            label.annotations[i].revised)
        ) {
          highestConfidenceAnnotation = label.annotations[i];
        }
      }
      labelToReturn = {
        ...label,
        annotations: [highestConfidenceAnnotation],
      };
    } else {
      labelToReturn = {
        ...label,
      };
    }
    return labelToReturn;
  },

  /**
   * Checks if annotation is being edited
   */
  isAnnotationInEditMode:
    (state) =>
    (annotationId, index = null) => {
      if (state.editAnnotation && annotationId) {
        if (index != null) {
          return (
            state.editAnnotation.id === annotationId &&
            state.editAnnotation.index === index
          );
        }
        return state.editAnnotation.id === annotationId;
      }
    },

  /**
   * Checks if it's currently searching for annotations
   */
  isSearchingAnnotationList: (state) => {
    if (
      !state.annotationFilters.showFeedbackNeeded ||
      !state.annotationFilters.showEmpty ||
      !state.annotationFilters.showAccepted
    ) {
      return true;
    }
    return state.annotationSearch && state.annotationSearch.length > 0;
  },

  /**
   * Get number of empty labels per annotation set
   */
  emptyLabels: (state, getters) => (annotationSet) => {
    const pendingEmpty = [];

    annotationSet.labels.map((label) => {
      const foundMissing = state.missingAnnotations.find(
        (l) =>
          l.label === label.id &&
          annotationSet.id === l.annotation_set &&
          annotationSet.label_set.id === l.label_set
      );

      const foundNegative = label.annotations.find((annotation) =>
        getters.isNegative(annotation)
      );

      if (!foundMissing && (label.annotations.length === 0 || foundNegative)) {
        pendingEmpty.push(label);
      }
    });

    return pendingEmpty;
  },

  annotationIsNotFound: (state) => (annotationSet, label) => {
    // Check if the combined label and label set have been marked as missing
    // or if the document is in public mode
    if (state.missingAnnotations.length === 0) {
      return false;
    } else {
      const found = state.missingAnnotations.filter(
        (el) =>
          el.label === label.id &&
          el.annotation_set === annotationSet.id &&
          el.label_set === annotationSet.label_set.id
      );
      return found.length !== 0;
    }
  },

  isAnnotationInAnnotationSet: (state) => (annotationSet, annotationId) => {
    // Check if the annotation exists in the annotation set
    let exists = false;
    for (let i = 0; i < annotationSet.labels.length; i++) {
      const label = annotationSet.labels[i];
      for (let j = 0; j < label.annotations.length; j++) {
        exists = label.annotations[j].id == annotationId;
        if (exists) {
          break;
        }
      }
      if (exists) {
        break;
      }
    }
    return exists;
  },

  annotationById: (state) => (annotationId) => {
    return state.annotations.find((ann) => ann.id == annotationId);
  },

  // Check if document is ready to be finished
  isDocumentReadyToFinishReview: (state) => {
    // check if all annotations are correct
    let notCorrect;

    const emptyAnnotations = [];

    if (state.labels.length === 0) return false;

    if (state.annotationSets && state.annotationSets.length > 0) {
      state.annotationSets.forEach((annSet) => {
        annSet.labels.map((label) => {
          // return only labels with empty annotations
          if (label.annotations.length === 0) {
            emptyAnnotations.push({
              label: label.id,
              label_set: annSet.label_set.id,
            });
          }
        });
      });
    }

    if (state.annotations) {
      notCorrect = state.annotations.filter((a) => !a.is_correct);

      if (notCorrect) {
        notCorrect.map((annotation) => {
          emptyAnnotations.push(annotation);
        });
      }
    }

    // if all annotations are correct
    // and if there are no empty annotations or
    // all empty annotations or negative annotations were marked as missing,
    // we can finish the review
    if (
      !emptyAnnotations ||
      !state.missingAnnotations ||
      state.missingAnnotations.length === emptyAnnotations.length
    ) {
      return true;
    }
    return false;
  },

  isDocumentReviewed: (state) => {
    return state.selectedDocument.is_reviewed;
  },

  /**
   * Get number of annotations pending review per annotation set
   */
  notCorrectAnnotations: () => (annotationSet) => {
    const labels = annotationSet.labels.filter(
      (label) => label.annotations.length > 0
    );

    const annotationsWithPendingReview = [];

    labels.map((label) => {
      const foundPendingAnnotations = label.annotations.filter(
        (ann) => !ann.is_correct && !ann.revised
      );

      if (foundPendingAnnotations && foundPendingAnnotations.length > 0) {
        foundPendingAnnotations.map((annotation) => {
          annotationsWithPendingReview.push(annotation);
        });
      }

      // Check if we have grouped annotations by same label
      if (state.enableGroupingFeature && label.annotations.length < 2) {
        return annotationsWithPendingReview.length - label.annotations.length;
      }
    });

    return annotationsWithPendingReview;
  },

  /**
   * Check if the document was extracted correctly and is ready to be reviewed
   */
  isDocumentReadyToBeReviewed: () => (document) => {
    return document.status_data === 2 && document.labeling_available === 1;
  },

  /**
   * Check if the document had an error during extraction
   */
  documentHadErrorDuringExtraction: () => (document) => {
    return document.status_data === 111;
  },

  /**
   * check if the document has a dataset status of 'Training', 'Test' or 'Preparation'
   * or if it is Ready Only / Reviewed
   * and if so disable the option to edit the document
   */
  documentCannotBeEdited:
    (state) =>
    (document = state.selectedDocument) => {
      return (
        document.dataset_status === 1 ||
        document.dataset_status === 2 ||
        document.dataset_status === 3 ||
        document.is_reviewed
      );
    },

  /**
   * If automatic splitting is enabled for the project
   */
  waitingForSplittingConfirmation: () => (document) => {
    return document && document.status_data === 41;
  },

  /**
   * Show the Smart Split switch or not
   */
  documentHasProposedSplit: () => (document) => {
    return document.proposed_split && document.proposed_split.length > 0;
  },

  /**
   * Check the level of confidence of an annotation
   */
  confidence: () => (annotation) => {
    if (annotation) {
      return annotation.confidence;
    } else {
      return null;
    }
  },

  /**
   * Check status of annotation
   */
  notExtracted: () => (annotation) => {
    if (annotation) {
      return !annotation.span;
    } else {
      return true;
    }
  },
  created: () => (annotation) => {
    if (annotation) {
      return (
        annotation.created_by && !annotation.revised && annotation.is_correct
      );
    } else {
      return null;
    }
  },
  edited: () => (annotation) => {
    if (annotation) {
      if (annotation.offset_string !== annotation.offset_string_original) {
        return true;
      } else if (annotation.created_by) {
        return true;
      } else {
        return false;
      }
    } else {
      return null;
    }
  },
  accepted: () => (annotation) => {
    if (annotation) {
      return annotation.revised && annotation.is_correct;
    } else {
      return null;
    }
  },
  isNegative: () => (annotation) => {
    if (annotation) {
      return !annotation.is_correct && annotation.revised;
    } else {
      return null;
    }
  },

  /**
   * Check for user who created or revised the annotation
   */
  getUser: () => (annotation) => {
    if (annotation) {
      if (annotation.created_by && !annotation.revised) {
        // If the annotation was created but not yet revised
        // we show who created it
        return annotation.created_by;
      } else if (annotation.revised && annotation.revised_by) {
        return annotation.revised_by;
      } else {
        // If both revised_by and created_by are null, we don't show any user
        return null;
      }
    } else {
      return null;
    }
  },

  /**
   * Check if there is just one annotation set from a label set
   */
  isOnlyMultipleAnnotationSet: (state) => (annotationSet) => {
    const sameSets = state.annotationSets.filter(
      (set) => set.label_set.id === annotationSet.label_set.id
    );

    return sameSets.length === 1 ? true : false;
  },

  /**
   * Check if the annotation set can appear multiple times
   */
  annotationSetCanBeMultiple: (_) => (annotationSet) => {
    return annotationSet.label_set.has_multiple_annotation_sets;
  },

  /**
   * Check if the annotation set has only empty labels
   */
  annotationSetHasNoFilledLabels: (_) => (annotationSet) => {
    const annotations = annotationSet.labels.flatMap((label) => {
      return label.annotations;
    });

    return annotations.length === 0 ? true : false;
  },
};

const actions = {
  startLoading: ({ commit }) => {
    commit("SET_LOADING", true);
    commit("display/ENABLE_SEARCH", false, { root: true });
  },
  endLoading: ({ commit }) => {
    commit("SET_LOADING", false);
  },
  setDocId: ({ commit }, id) => {
    commit("SET_PAGES", []);
    commit("SET_DOC_ID", id);
  },
  setAnnotationId: ({ commit }, id) => {
    commit("SET_ANNOTATION_ID", id);
    setURLAnnotationHash(id);
  },
  setAnnotationSetId: ({ commit }, id) => {
    commit("SET_ANNOTATION_SET_ID", id);
  },
  setAnnotationSets: ({ commit }, annotationSets) => {
    commit("SET_ANNOTATION_SETS", annotationSets);
  },
  setEditAnnotation: (
    { commit },
    { id, index, label, labelSet, annotationSet, pageNumber }
  ) => {
    const value = {
      id,
      index,
      label,
      labelSet,
      annotationSet,
      pageNumber,
    };
    commit("SET_EDIT_ANNOTATION", value);
  },
  resetEditAnnotation: ({ commit }) => {
    commit("RESET_EDIT_ANNOTATION");
  },
  setAnnotations: ({ commit }, annotations) => {
    commit("SET_ANNOTATIONS", annotations);
  },
  setLabels: ({ commit }, labels) => {
    commit("SET_LABELS", labels);
  },
  setPages: ({ commit }, pages) => {
    commit("SET_PAGES", pages);
  },
  setSelectedDocument: ({ commit }, document) => {
    commit("SET_SELECTED_DOCUMENT", document);
  },
  setPublicView: ({ commit }, publicView) => {
    commit("SET_PUBLIC_VIEW", publicView);
  },
  startRecalculatingAnnotations: ({ commit }) => {
    commit("SET_RECALCULATING_ANNOTATIONS", true);
  },
  endRecalculatingAnnotations: ({ commit }) => {
    commit("SET_RECALCULATING_ANNOTATIONS", false);
  },
  setMissingAnnotations: ({ commit }, missingAnnotations) => {
    commit("SET_MISSING_ANNOTATIONS", missingAnnotations);
  },
  setErrorMessage: ({ commit, dispatch }, message) => {
    if (message) {
      commit("SET_SHOW_ACTION_ERROR", true);
    } else {
      commit("SET_SHOW_ACTION_ERROR", false);
    }

    commit("SET_ERROR_MESSAGE", message);

    dispatch("closeErrorMessage");
  },
  setDocumentError: ({ commit }, value) => {
    commit("SET_DOCUMENT_ERROR", value);
  },
  setAnnotationsMarkedAsMissing: ({ commit }, annotations) => {
    commit("SET_ANNOTATIONS_MARKED_AS_MISSING", annotations);
  },
  setErrorMessageWidth: ({ commit }, width) => {
    commit("SET_ERROR_MESSAGE_WIDTH", width);
  },
  setHoveredAnnotationSet: ({ commit }, annotationSet) => {
    commit("SET_HOVERED_ANNOTATION_SET", annotationSet);
  },
  setNewAcceptedAnnotations: ({ commit }, annotations) => {
    commit("SET_NEW_ACCEPTED_ANNOTATIONS", annotations);
  },
  setSplittingSuggestions: ({ commit }, value) => {
    commit("SET_SPLITTING_SUGGESTIONS", value);
  },
  setAnnotationSearch: ({ commit }, value) => {
    commit("SET_ANNOTATION_SEARCH", value);
  },

  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchDocument: async (
    { commit, state, dispatch, rootState, getters },
    pollDocumentList = false
  ) => {
    let projectId = null;
    let categoryId = null;
    let isRecalculatingAnnotations = false;

    const initialPage = 1;

    dispatch("startLoading");
    dispatch("display/updateCurrentPage", initialPage, {
      root: true,
    });

    await HTTP.get(`documents/${state.documentId}/`)
      .then(async (response) => {
        if (response.data) {
          const { labels, annotations, annotationSets } =
            getters.processAnnotationSets(response.data.annotation_sets);

          // load first page
          if (response.data.pages.length > 0) {
            dispatch("fetchDocumentPage", initialPage);
          }

          // set information on the store
          commit("SET_ANNOTATION_SETS", annotationSets);
          commit("SET_ANNOTATIONS", annotations);
          commit("SET_LABELS", labels);
          commit("SET_SELECTED_DOCUMENT", response.data);

          if (response.data.project) {
            projectId = response.data.project;

            dispatch("project/setProjectId", projectId, {
              root: true,
            });

            dispatch(
              "project/setShowAnnotationTranslations",
              response.data.enable_translated_strings,
              {
                root: true,
              }
            );
          }

          if (getters.documentHasProposedSplit(response.data)) {
            commit("SET_SPLITTING_SUGGESTIONS", response.data.proposed_split);
          }

          categoryId = response.data.category;
          // TODO: add this validation to a method
          isRecalculatingAnnotations = response.data.labeling_available !== 1;
        }
      })
      .catch((error) => {
        console.log(error, "Could not fetch document details from the backend");
        dispatch("display/setPageError", error.response.data.detail, {
          root: true,
        });
        return;
      });

    if (!state.publicView) {
      await dispatch("fetchMissingAnnotations");

      await dispatch("project/fetchCurrentUser", null, {
        root: true,
      });

      // Check if we first open the document dashboard or the edit mode
      if (
        !state.selectedDocument.category ||
        (!state.selectedDocument.category_is_revised &&
          !getters.documentHasCorrectAnnotations &&
          state.missingAnnotations.length === 0)
      ) {
        dispatch("edit/enableEditMode", null, {
          root: true,
        });
        dispatch("edit/setRenameAndCategorize", true, { root: true });
      }

      if (projectId) {
        await dispatch("category/fetchCategories", projectId, {
          root: true,
        });

        // get list of documents not reviewed
        await dispatch("project/fetchDocumentList", "is_reviewed=false", {
          root: true,
        });
      }
      if (categoryId && rootState.category.createAvailableListOfDocuments) {
        await dispatch(
          "category/createAvailableDocumentsList",
          {
            categoryId,
            user: rootState.project.currentUser.username,
            poll: pollDocumentList,
          },
          {
            root: true,
          }
        );
      }
    }
    if (isRecalculatingAnnotations) {
      commit("SET_RECALCULATING_ANNOTATIONS", true);
      dispatch("pollDocumentEndpoint");
    }
    dispatch("endLoading");
  },

  // Get document page data
  fetchDocumentPage: ({ commit, state }, page) => {
    return HTTP.get(`documents/${state.documentId}/pages/${page}/`)
      .then((response) => {
        commit("ADD_PAGE", response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  },

  setDocumentAnnotationSelected: (
    { commit },
    { annotation, label, span, scrollTo = false }
  ) => {
    const value = {
      scrollTo,
      id: annotation.id,
      span,
      page: span.page_index + 1,
      labelName: label ? label.name : "",
    };
    commit("SET_DOCUMENT_ANNOTATION_SELECTED", value);
  },

  scrollToDocumentAnnotationSelected: ({ commit }) => {
    commit("SET_DOCUMENT_ANNOTATION_SCROLL", true);
  },

  disableDocumentAnnotationSelected: ({ commit }) => {
    commit("SET_DOCUMENT_ANNOTATION_SELECTED", null);
  },

  createAnnotation: (
    { commit, getters, dispatch },
    { annotation, negativeAnnotationId }
  ) => {
    return new Promise((resolve, reject) => {
      HTTP.post(`/annotations/`, annotation)
        .then(async (response) => {
          if (response.status === 201) {
            await dispatch("fetchMissingAnnotations");

            if (!getters.annotationSetExists(response.data.annotation_set)) {
              const documentData = await dispatch("fetchDocumentData");
              if (documentData && documentData.annotation_sets) {
                const { labels, annotations, annotationSets } =
                  getters.processAnnotationSets(documentData.annotation_sets);
                commit("SET_ANNOTATION_SETS", annotationSets);
                commit("SET_ANNOTATIONS", annotations);
                commit("SET_LABELS", labels);
              }
            } else {
              commit("ADD_ANNOTATION", response.data);
              if (response.data && response.data.id) {
                dispatch("setAnnotationId", response.data.id);
              }
              if (negativeAnnotationId) {
                commit("DELETE_ANNOTATION", negativeAnnotationId);
              }
            }

            resolve(response);
          }
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  updateAnnotation: (
    { commit, getters, dispatch },
    { updatedValues, annotationId }
  ) => {
    commit("SET_NEW_ACCEPTED_ANNOTATIONS", [annotationId]);

    return new Promise((resolve, reject) => {
      HTTP.patch(`/annotations/${annotationId}/`, updatedValues)
        .then(async (response) => {
          if (response.status === 200) {
            commit("UPDATE_ANNOTATION", response.data);
            commit("SET_NEW_ACCEPTED_ANNOTATIONS", null);

            resolve(true);
          }
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  deleteAnnotation: ({ commit, getters }, { annotationId, annotationSet }) => {
    return new Promise((resolve, reject) => {
      HTTP.delete(`/annotations/${annotationId}/`)
        .then(async (response) => {
          if (response.status === 204) {
            commit("DELETE_ANNOTATION", annotationId);

            // Check if the deleted annotation was the last one in a multiple annotation set
            // and if the annotation set has no annotations
            if (
              annotationSet &&
              getters.annotationSetCanBeMultiple(annotationSet) &&
              getters.annotationSetHasNoFilledLabels(annotationSet)
            ) {
              // Check if there is still 1 or more multiple annotation sets for the same label set
              if (getters.isOnlyMultipleAnnotationSet(annotationSet)) {
                commit("UPDATE_ANNOTATION_SET", annotationSet);
              } else {
                commit("DELETE_ANNOTATION_SET", annotationSet);
              }
            }

            resolve(true);
          }
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  updateDocument: ({ commit, state, getters, dispatch }, updatedDocument) => {
    return new Promise((resolve, reject) => {
      HTTP.patch(`/documents/${state.documentId}/`, updatedDocument)
        .then((response) => {
          if (response.status === 200) {
            if (updatedDocument.data_file_name) {
              // if the only change was the file name, don't reload the page
              // only update the file name for the selectedDocument
              commit("UPDATE_FILE_NAME", response.data.data_file_name);
            } else {
              commit("SET_SELECTED_DOCUMENT", response.data);

              dispatch("pollDocumentEndpoint");
            }

            resolve(true);
          }
        })
        .catch((error) => {
          console.log(error);
          // check if review error
          if (
            error.response &&
            error.response.request &&
            error.response.request.response
          ) {
            const is_reviewed = JSON.parse(error.request.response).is_reviewed;
            if (is_reviewed && is_reviewed.length > 0) {
              const errorData = {
                data: [...is_reviewed],
              };
              reject(errorData);
              return;
            }
          }
          reject(error.response);
        });
    });
  },

  fetchMissingAnnotations: ({ commit, state, getters }) => {
    return new Promise((resolve, reject) => {
      return HTTP.get(
        `/missing-annotations/?document=${state.documentId}&limit=100`
      )
        .then((response) => {
          commit("SET_MISSING_ANNOTATIONS", response.data.results);
          resolve(true);
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  addMissingAnnotations: ({ commit, getters }, missingAnnotations) => {
    return new Promise((resolve, reject) => {
      HTTP.post(`/missing-annotations/`, missingAnnotations)
        .then(async (response) => {
          if (response.status === 201) {
            commit("SET_ANNOTATIONS_MARKED_AS_MISSING", null);
            commit("ADD_MISSING_ANNOTATIONS", response.data);
          }

          resolve(response);
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  deleteMissingAnnotation: ({ commit, getters }, id) => {
    return new Promise((resolve, reject) => {
      return HTTP.delete(`/missing-annotations/${id}/`)
        .then((response) => {
          if (response.status === 204) {
            commit("DELETE_MISSING_ANNOTATION", id);
            resolve(true);
          }
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  updateMultipleAnnotations: ({ state, commit }, annotations) => {
    commit("SET_NEW_ACCEPTED_ANNOTATIONS", annotations.ids);

    return new Promise((resolve, reject) => {
      return HTTP.patch(
        `documents/${state.documentId}/update-annotations/`,
        annotations
      )
        .then((response) => {
          if (response.status === 200) {
            response.data.map((annotation) => {
              commit("UPDATE_ANNOTATION", annotation);
            });
            commit("SET_NEW_ACCEPTED_ANNOTATIONS", null);
            resolve(true);
          }
        })
        .catch((error) => {
          console.log(error);
          reject(error.response);
        });
    });
  },

  fetchDocumentStatus: ({ state, getters }) => {
    return new Promise((resolve, reject) => {
      return HTTP.get(
        `documents/${state.documentId}/?fields=status_data,labeling_available`
      )
        .then((response) => {
          if (
            getters.isDocumentReadyToBeReviewed(response.data) ||
            getters.waitingForSplittingConfirmation(response.data)
          ) {
            // ready or has splitting suggestions
            return resolve(true);
          } else if (getters.documentHadErrorDuringExtraction(response.data)) {
            // error
            return reject();
          } else {
            // not yet ready
            return resolve(false);
          }
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  // Get document data
  fetchDocumentData: ({ state }) => {
    return new Promise((resolve, reject) => {
      HTTP.get(`documents/${state.documentId}/`)
        .then((response) => {
          return resolve(response.data);
        })
        .catch((error) => {
          reject(error);
          console.log(error);
        });
    });
  },

  // Poll Document endpoint to know if the Document is ready to be reviewed
  // or even if there was an error during the extraction
  pollDocumentEndpoint: ({ dispatch }) => {
    return dispatch("fetchDocumentStatus")
      .then((ready) => {
        if (ready) {
          // Stop document recalculating annotations
          dispatch("endRecalculatingAnnotations");
          dispatch("fetchDocument");
        } else {
          sleep(documentPollDuration);
          dispatch("pollDocumentEndpoint");
        }
      })
      .catch((error) => {
        dispatch("setDocumentError", true);
        console.log(error);
      });
  },

  createErrorMessage: (
    { commit, dispatch },
    { error, serverErrorMessage, defaultErrorMessage }
  ) => {
    // check type of error
    if (error && error.status >= 500 && error.status < 600) {
      dispatch("setErrorMessage", serverErrorMessage);
      commit("SET_SERVER_ERROR", true);
    } else if (error.data && error.data.length > 0) {
      dispatch("setErrorMessage", error.data[0]);
    } else {
      dispatch("setErrorMessage", defaultErrorMessage);
    }
  },

  closeErrorMessage: ({ commit }) => {
    setTimeout(() => {
      commit("SET_ERROR_MESSAGE", null);
      commit("SET_SHOW_ACTION_ERROR", false);
      commit("SET_SERVER_ERROR", false);
    }, 5000);
  },

  contactSupport: ({ rootState }, error) => {
    const url = "https://konfuzio.com/support/";
    const params = `project=${rootState.project.projectId}&email=${rootState.project.currentUser.username}&issue=${error}`;
    const fullUrl = `${url}?${params}`;

    window.open(fullUrl, "_blank");
  },

  changeCurrentDocument: ({ commit, state, dispatch }, newDocumentId) => {
    // reset splitting suggestions
    if (state.splittingSuggestions) {
      commit("SET_SPLITTING_SUGGESTIONS", null);
    }
    commit("SET_RECALCULATING_ANNOTATIONS", false);

    if (getURLQueryParam("document") || getURLPath("d")) {
      navigateToNewDocumentURL(state.selectedDocument.id, newDocumentId);
    } else {
      commit("SET_DOC_ID", newDocumentId);
      dispatch("fetchDocument");
    }
  },
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_DOC_ID: (state, id) => {
    if (id !== state.documentId) {
      state.documentId = id;
    }
  },
  SET_ANNOTATION_ID: (state, id) => {
    state.annotationId = id;
  },
  SET_ANNOTATION_SET_ID: (state, id) => {
    state.annotationSetId = id;
  },
  ADD_ANNOTATION: (state, annotation) => {
    state.annotations.push(annotation);
    state.annotationSets.map((annotationSet) => {
      if (
        annotation.annotation_set === annotationSet.id &&
        annotation.label_set &&
        annotationSet.label_set.id === annotation.label_set.id
      ) {
        annotationSet.labels.map((label) => {
          if (annotation.label && annotation.label.id === label.id) {
            const exists = label.annotations.find(
              (existingAnnotation) => existingAnnotation.id === annotation.id
            );

            if (!exists) {
              label.annotations.push(annotation);
              return;
            }
          }
        });
      }
    });
  },
  UPDATE_ANNOTATION: (state, annotation) => {
    const indexOfAnnotationInAnnotations = state.annotations.findIndex(
      (existingAnnotation) => existingAnnotation.id === annotation.id
    );
    if (indexOfAnnotationInAnnotations > -1) {
      state.annotations.splice(indexOfAnnotationInAnnotations, 1, annotation);
    }
    let updatedAnnotation = false;
    state.annotationSets.forEach((annotationSet) => {
      if (updatedAnnotation) {
        return;
      }
      annotationSet.labels.forEach((label) => {
        const indexOfAnnotationAnnotationSets = label.annotations.findIndex(
          (existingAnnotation) => existingAnnotation.id === annotation.id
        );
        if (indexOfAnnotationAnnotationSets > -1) {
          // checks if an annotation label was changed and add it to the new label
          if (annotation.label && annotation.label.id !== label.id) {
            label.annotations.splice(indexOfAnnotationAnnotationSets, 1);

            const labelToAdd = annotationSet.labels.find(
              (labelToAdd) => labelToAdd.id === annotation.label.id
            );
            labelToAdd.annotations.push(annotation);
          } else {
            label.annotations.splice(
              indexOfAnnotationAnnotationSets,
              1,
              annotation
            );
          }
          updatedAnnotation = true;
          return;
        }
      });
    });
  },
  DELETE_ANNOTATION: (state, annotationId) => {
    const indexOfAnnotationToDelete = state.annotations.findIndex(
      (existingAnnotation) => existingAnnotation.id === annotationId
    );
    if (indexOfAnnotationToDelete > -1) {
      state.annotations.splice(indexOfAnnotationToDelete, 1);
    }
    let deleted = false;
    state.annotationSets.forEach((annotationSet) => {
      if (deleted) {
        return;
      }
      annotationSet.labels.forEach((label) => {
        const indexOfAnnotationInLabelToDelete = label.annotations.findIndex(
          (existingAnnotation) => existingAnnotation.id === annotationId
        );
        if (indexOfAnnotationInLabelToDelete > -1) {
          label.annotations.splice(indexOfAnnotationInLabelToDelete, 1);
          deleted = true;
          return;
        }
      });
    });
  },
  SET_ANNOTATIONS: (state, annotations) => {
    state.annotations = annotations;
  },
  SET_ANNOTATION_SETS: (state, annotationSets) => {
    state.annotationSets = annotationSets;
  },
  DELETE_ANNOTATION_SET: (state, annotationSet) => {
    const indexOfSetToDelete = state.annotationSets.findIndex(
      (existingAnnotationSet) => existingAnnotationSet.id === annotationSet.id
    );

    if (indexOfSetToDelete === -1) return;

    state.annotationSets.splice(indexOfSetToDelete, 1);
  },
  UPDATE_ANNOTATION_SET: (state, annotationSet) => {
    const indexOfExistingAnnotationSet = state.annotationSets.findIndex(
      (existingAnnotationSet) => existingAnnotationSet.id === annotationSet.id
    );

    if (indexOfExistingAnnotationSet === -1) return;

    const updatedSet = { ...annotationSet, id: null };

    state.annotationSets.splice(indexOfExistingAnnotationSet, 1, updatedSet);
  },
  SET_LABELS: (state, labels) => {
    state.labels = labels;
  },
  SET_EDIT_ANNOTATION: (state, editAnnotation) => {
    state.editAnnotation = editAnnotation;
  },
  RESET_EDIT_ANNOTATION: (state) => {
    state.editAnnotation = null;
  },
  ADD_PAGE: (state, page) => {
    // if we already have the page in the state, update it in
    // the pages array instead of creating a new one
    const existingPageIndex = state.pages.findIndex(
      (p) => p.number === page.number
    );
    if (existingPageIndex === -1) {
      state.pages.push(page);
    } else {
      state.pages[existingPageIndex] = page;
    }
  },
  SET_PAGES: (state, pages) => {
    state.pages = pages;
  },
  SET_DOCUMENT_ANNOTATION_SELECTED: (state, documentAnnotationSelected) => {
    state.documentAnnotationSelected = documentAnnotationSelected;
  },
  SET_DOCUMENT_ANNOTATION_SCROLL: (state, scrollTo) => {
    if (state.documentAnnotationSelected) {
      state.documentAnnotationSelected.scrollTo = scrollTo;
    }
  },
  SET_SELECTED_DOCUMENT: (state, document) => {
    state.selectedDocument = document;

    // this is to handle cache when a document is edited or changed
    if (state.selectedDocument) {
      state.selectedDocument.downloaded_at = Date.now();
    }
  },
  SET_RECALCULATING_ANNOTATIONS: (state, recalculatingAnnotations) => {
    state.recalculatingAnnotations = recalculatingAnnotations;
  },
  SET_MISSING_ANNOTATIONS: (state, missingAnnotations) => {
    state.missingAnnotations = missingAnnotations;
  },
  ADD_MISSING_ANNOTATIONS: (state, annotations) => {
    if (annotations && annotations.length > 0) {
      annotations.map((annotation) => {
        // check if already in missingAnnotations
        const found = state.missingAnnotations.find(
          (missingAnnotation) => missingAnnotation.id === annotation.id
        );

        if (found) {
          const indexOfAnnotation = state.missingAnnotations.findIndex(
            (missingAnnotation) => missingAnnotation.id === annotation.id
          );

          if (indexOfAnnotation > -1) {
            state.missingAnnotations.splice(indexOfAnnotation, 1, annotation);
          }
        } else {
          state.missingAnnotations.push(annotation);
        }
      });
    } else {
      state.missingAnnotations.push(annotations);
    }
  },
  DELETE_MISSING_ANNOTATION: (state, id) => {
    const indexOfAnnotationToDelete = state.missingAnnotations.findIndex(
      (annotation) => annotation.id === id
    );

    if (indexOfAnnotationToDelete > -1) {
      state.missingAnnotations.splice(indexOfAnnotationToDelete, 1);
    }
  },
  SET_SHOW_ACTION_ERROR: (state, value) => {
    state.showActionError = value;
  },
  SET_ERROR_MESSAGE: (state, message) => {
    state.errorMessage = message;
  },
  SET_DOCUMENT_ERROR: (state, value) => {
    state.showDocumentError = value;
  },
  SET_ANNOTATIONS_MARKED_AS_MISSING: (state, annotations) => {
    state.annotationsMarkedAsMissing = annotations;
  },
  SET_ERROR_MESSAGE_WIDTH: (state, width) => {
    state.errorMessageWidth = width;
  },
  SET_PUBLIC_VIEW: (state, value) => {
    state.publicView = value;
  },
  SET_DOCUMENT_IS_READY: (state, value) => {
    state.documentIsReady = value;
  },
  SET_DOCUMENT_HAS_ERROR: (state, value) => {
    state.documentHasError = value;
  },
  SET_HOVERED_ANNOTATION_SET: (state, hoveredAnnotationSet) => {
    state.hoveredAnnotationSet = hoveredAnnotationSet;
  },
  SET_NEW_ACCEPTED_ANNOTATIONS: (state, annotations) => {
    state.newAcceptedAnnotations = annotations;
  },
  SET_SERVER_ERROR: (state, value) => {
    state.serverError = value;
  },
  UPDATE_FILE_NAME: (state, value) => {
    state.selectedDocument.data_file_name = value;
  },
  SET_SPLITTING_SUGGESTIONS: (state, array) => {
    state.splittingSuggestions = array;
  },
  SET_ANNOTATION_SEARCH: (state, search) => {
    state.annotationSearch = search;
    setURLQueryParam("search", search);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
