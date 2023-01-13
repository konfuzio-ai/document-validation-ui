import myImports from "../api";
import sleep from "../utils/utils";

const HTTP = myImports.HTTP;
const documentPollDuration = 1000;

const state = {
  loading: true,
  pages: [],
  annotationSets: null,
  annotations: null,
  labels: [],
  documentId: null,
  sidebarAnnotationSelected: null,
  documentAnnotationSelected: null,
  selectedDocument: null,
  recalculatingAnnotations: false,
  editAnnotation: null,
  missingAnnotations: [],
  publicView: true,
  showActionError: false,
  errorMessage: null,
  showDocumentError: false,
  rejectedMissingAnnotations: null,
  errorMessageWidth: null,
  hoveredAnnotationSet: null,
  finishedReview: false,
  newAcceptedAnnotations: null,
  selectedEntities: null,
  serverError: false,
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
        state.selectedDocument.is_category_accepted ||
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
  labelsFilteredForAnnotationCreation: (state) => (set) => {
    let returnLabels = [];
    if (set.id && set.labels) {
      // if existing ann set, check for multiple
      returnLabels = set.labels.filter((label) => {
        // check if label has multiple and if not, if there's already an annotation created
        if (!label.has_multiple_top_candidates) {
          const existingLabel = state.labels.find((documentLabel) => {
            return documentLabel.id === label.id;
          });
          return (
            existingLabel &&
            existingLabel.annotations &&
            existingLabel.annotations.length === 0
          );
        } else {
          return true;
        }
      });
    } else if (set.labels) {
      // if not existing ann set, then return all labels
      returnLabels = set.labels;
    }
    return returnLabels;
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

  /* Process annotations and extract labels and sets */
  processAnnotationSets: (state, getters) => (annotationSets) => {
    // group annotations for sidebar
    const annotations = [];
    const labels = [];
    const processedAnnotationSets = annotationSets.map((annotationSet) => {
      const annotationSetLabels = annotationSet.labels.map((label) => {
        // filter label
        const filteredLabel = getters.annotationsInLabelFiltered(label);

        // add annotations to the document array
        annotations.push(...filteredLabel.annotations);
        labels.push(filteredLabel);
        // add labels to the labels array
        return filteredLabel;
      });
      annotationSet.labels = annotationSetLabels;
      return annotationSet;
    });

    return {
      annotationSets: processedAnnotationSets,
      labels,
      annotations,
    };
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
      state.annotationSets.map((annotationSetTemp) => {
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
   * Get number of empty labels per annotation set
   */
  emptyLabelsLength: (state) => (annotationSet) => {
    const labels = annotationSet.labels.filter(
      (label) => label.annotations.length === 0
    );

    const pendingEmpty = [];

    labels.map((label) => {
      const found = state.missingAnnotations.find(
        (l) => l.label === label.id && annotationSet.id === l.annotation_set
      );

      if (!found) {
        pendingEmpty.push(label);
      }
    });

    return pendingEmpty.length;
  },

  // Check if document is ready to be finished
  isDocumentReviewFinished: (state) => () => {
    // check if all annotations have been revised
    let notRevised;

    const emptyAnnotations = [];

    if (state.annotationSets) {
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
      notRevised = state.annotations.filter((a) => !a.revised);
    }

    // if all annotations have been revised
    // and if there are no empty annotations or
    // all empty annotations were rejected,
    // we can finish the review
    if (
      !emptyAnnotations ||
      !state.missingAnnotations ||
      !notRevised ||
      (notRevised.length === 0 &&
        state.missingAnnotations.length === emptyAnnotations.length)
    ) {
      return true;
    }

    return false;
  },

  /**
   * Get number of annotations pending review per annotation set
   */
  annotationsWithPendingReviewLength: () => (annotationSet) => {
    const labels = annotationSet.labels.filter(
      (label) => label.annotations.length > 0
    );

    const annotationsWithPendingReview = [];

    labels.map((label) => {
      const foundPendingAnnotation = label.annotations.find(
        (ann) => !ann.revised
      );

      if (foundPendingAnnotation) {
        annotationsWithPendingReview.push(foundPendingAnnotation);
      }
    });

    // Check if we have grouped annotations by same label
    if (state.enableGroupingFeature && label.annotations.length < 2) {
      return annotationsWithPendingReview.length - label.annotations.length;
    }

    return annotationsWithPendingReview.length;
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
  documentCannotBeEdited: (state) => (document) => {
    return (
      document.dataset_status === 1 ||
      document.dataset_status === 2 ||
      document.dataset_status === 3 ||
      document.is_reviewed ||
      state.publicView
    );
  },

  getTextFromEntities: (state) => () => {
    return state.selectedEntities
      .map((entity) => {
        return entity.content;
      })
      .join(" ");
  },
};

const actions = {
  startLoading: ({ commit }) => {
    commit("SET_LOADING", true);
  },
  endLoading: ({ commit }) => {
    commit("SET_LOADING", false);
  },
  setDocId: ({ commit }, id) => {
    commit("SET_PAGES", []);
    commit("SET_DOC_ID", id);
  },
  setSidebarAnnotationSelected: ({ commit }, annotation) => {
    commit("SET_ANNOTATION_SELECTED", annotation);
  },
  setAnnotationSets: ({ commit }, annotationSets) => {
    commit("SET_ANNOTATION_SETS", annotationSets);
  },
  setEditAnnotation: (
    { commit },
    { id, index, label, labelSet, annotationSet }
  ) => {
    const value = {
      id,
      index,
      label,
      labelSet,
      annotationSet,
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
  setRejectedMissingAnnotations: ({ commit }, annotations) => {
    commit("SET_REJECTED_MISSING_ANNOTATIONS", annotations);
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
  setSelectedEntities: ({ commit }, entities) => {
    commit("SET_SELECTED_ENTITIES", entities);
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
            await dispatch("fetchDocumentPage", initialPage);
          }
          // set information on the store
          commit("SET_ANNOTATION_SETS", annotationSets);
          commit("SET_ANNOTATIONS", annotations);
          commit("SET_LABELS", labels);
          commit("SET_SELECTED_DOCUMENT", response.data);
          commit("SET_FINISHED_REVIEW", getters.isDocumentReviewFinished());

          if (rootState.project.projectId) {
            projectId = rootState.project.projectId;
          } else {
            projectId = response.data.project;
            dispatch("project/setProjectId", response.data.project, {
              root: true,
            });
          }

          categoryId = response.data.category;
          // TODO: add this validation to a method
          isRecalculatingAnnotations = response.data.labeling_available !== 1;
        }
      })
      .catch((error) => {
        console.log(error, "Could not fetch document details from the backend");
        return;
      });

    await dispatch("fetchMissingAnnotations");

    if (!state.publicView) {
      await dispatch("project/fetchCurrentUser", null, {
        root: true,
      });

      if (projectId) {
        await dispatch("category/fetchCategories", projectId, {
          root: true,
        });
      }
      if (categoryId) {
        await dispatch(
          "category/createAvailableDocumentsList",
          {
            categoryId,
            user: rootState.project.currentUser,
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
      labelName: label.name,
    };
    commit("SET_DOCUMENT_ANNOTATION_SELECTED", value);
  },

  scrollToDocumentAnnotationSelected: ({ commit }) => {
    commit("SET_DOCUMENT_ANNOTATION_SCROLL", true);
  },

  disableDocumentAnnotationSelected: ({ commit }) => {
    commit("SET_DOCUMENT_ANNOTATION_SELECTED", null);
  },

  createAnnotation: ({ commit, getters, dispatch }, annotation) => {
    return new Promise((resolve) => {
      HTTP.post(`/annotations/`, annotation)
        .then(async (response) => {
          if (response.status === 201) {
            dispatch("fetchMissingAnnotations");
            commit("SET_FINISHED_REVIEW", getters.isDocumentReviewFinished());

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
            }
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },

  updateAnnotation: ({ commit, getters }, { updatedValues, annotationId }) => {
    commit("SET_NEW_ACCEPTED_ANNOTATIONS", [annotationId]);

    return new Promise((resolve) => {
      HTTP.patch(`/annotations/${annotationId}/`, updatedValues)
        .then((response) => {
          if (response.status === 200) {
            commit("UPDATE_ANNOTATION", response.data);
            commit("SET_FINISHED_REVIEW", getters.isDocumentReviewFinished());
            commit("SET_NEW_ACCEPTED_ANNOTATIONS", null);
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },

  deleteAnnotation: ({ commit, getters }, { annotationId }) => {
    return new Promise((resolve) => {
      HTTP.delete(`/annotations/${annotationId}/`)
        .then((response) => {
          if (response.status === 204) {
            commit("DELETE_ANNOTATION", annotationId);
            commit("SET_FINISHED_REVIEW", getters.isDocumentReviewFinished());
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },

  updateDocument: ({ commit, state, getters }, updatedDocument) => {
    return new Promise((resolve) => {
      HTTP.patch(`/documents/${state.documentId}/`, updatedDocument)
        .then((response) => {
          if (response.status === 200) {
            // TODO: remove this after implementation in backend for is_category_accepted
            if (updatedDocument.is_category_accepted) {
              response.data.is_category_accepted = true;
            }

            commit("SET_SELECTED_DOCUMENT", response.data);
            commit("SET_FINISHED_REVIEW", getters.isDocumentReviewFinished());
            dispatch("pollDocumentEndpoint");
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },

  fetchMissingAnnotations: ({ commit, state, getters }) => {
    return HTTP.get(
      `/missing-annotations/?document=${state.documentId}&limit=100`
    )
      .then((response) => {
        commit("SET_MISSING_ANNOTATIONS", response.data.results);
        commit("SET_FINISHED_REVIEW", getters.isDocumentReviewFinished());
      })
      .catch((error) => {
        console.log(error);
      });
  },

  addMissingAnnotations: ({ commit, dispatch }, missingAnnotations) => {
    return new Promise((resolve) => {
      return HTTP.post(`/missing-annotations/`, missingAnnotations)
        .then((response) => {
          if (response.status === 201) {
            commit("SET_REJECTED_MISSING_ANNOTATIONS", null);
            dispatch("fetchMissingAnnotations");
          }

          resolve(response);
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },

  deleteMissingAnnotation: ({ commit, getters, dispatch }, id) => {
    return new Promise((resolve) => {
      return HTTP.delete(`/missing-annotations/${id}/`)
        .then((response) => {
          if (response.status === 204) {
            dispatch("fetchMissingAnnotations");
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },

  updateMultipleAnnotations: ({ state, commit }, annotations) => {
    commit("SET_NEW_ACCEPTED_ANNOTATIONS", annotations.ids);

    return new Promise((resolve) => {
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
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          console.log(error);
          resolve(error.response);
        });
    });
  },

  fetchDocumentStatus: ({ state, getters }) => {
    return new Promise((resolve, reject) => {
      return HTTP.get(
        `documents/${state.documentId}/?fields=status_data,labeling_available`
      )
        .then((response) => {
          if (getters.isDocumentReadyToBeReviewed(response.data)) {
            // ready
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
    { response, serverErrorMessage, defaultErrorMessage }
  ) => {
    let responseAsString;

    if (response.status) {
      responseAsString = response.status.toString();
    }

    // check type of error
    if (response.data && response.data.length > 0) {
      dispatch("setErrorMessage", response.data[0]);
    } else if (responseAsString.startsWith("5")) {
      dispatch("setErrorMessage", serverErrorMessage);
      commit("SET_SERVER_ERROR", true);
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
    let url;
    const params = `project=${rootState.project.projectId}&email=${rootState.project.currentUser}&issue=${error}`;

    if (process.env.VUE_APP_I18N_LOCALE == "de") {
      url = "https://konfuzio.com/de/support/";
    } else {
      url = "https://konfuzio.com/en/support/";
    }

    window.open(`${url}?${params}`, "_blank");
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
      state.annotations[indexOfAnnotationInAnnotations] = annotation;
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
          label.annotations.splice(
            indexOfAnnotationAnnotationSets,
            1,
            annotation
          );
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
  SET_LABELS: (state, labels) => {
    state.labels = labels;
  },
  SET_ANNOTATION_SELECTED: (state, annotation) => {
    state.sidebarAnnotationSelected = annotation;
  },
  SET_EDIT_ANNOTATION: (state, editAnnotation) => {
    state.editAnnotation = editAnnotation;
  },
  SET_FINISHED_REVIEW: (state, finishedReview) => {
    state.finishedReview = finishedReview;
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
    if (document.is_reviewed === true) {
      state.publicView = true;
    }
    state.selectedDocument = document;

    // this is to handle cache when a document is edited or changed
    state.selectedDocument.downloaded_at = Date.now();
  },
  SET_RECALCULATING_ANNOTATIONS: (state, recalculatingAnnotations) => {
    state.recalculatingAnnotations = recalculatingAnnotations;
  },
  SET_MISSING_ANNOTATIONS: (state, missingAnnotations) => {
    state.missingAnnotations = missingAnnotations;
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
  SET_REJECTED_MISSING_ANNOTATIONS: (state, annotations) => {
    state.rejectedMissingAnnotations = annotations;
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
  SET_SELECTED_ENTITIES: (state, entities) => {
    state.selectedEntities = entities;
  },
  SET_SERVER_ERROR: (state, value) => {
    state.serverError = value;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
