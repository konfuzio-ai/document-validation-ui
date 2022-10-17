import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentFocusedAnnotation: null,
  loading: true,
  pages: [],
  annotationSets: null,
  annotations: null,
  labels: [],
  documentId: null,
  sidebarAnnotationSelected: null,
  selectedDocument: null,
  recalculatingAnnotations: false,
  editMode: false,
  editAnnotation: {
    id: null,
    index: 0,
    label: null,
    label_set: null
  },
  missingAnnotations: [],
  currentUser: null,
  publicView: process.env.VUE_APP_GUEST_USER_TOKEN == null,
  editingActive: false,
  showError: false,
  errorMessage: null,
  acceptAnnotation: false,
  showDocumentError: false,
  imageLoaded: false,
  rejectAnnotation: null
};

const getters = {
  /**
   * Number of pages. If the pages array doesn't exist yet, return 0.
   */
  pageCount: state => {
    if (state.pages) {
      return state.pages.length;
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
  pageAtIndex: state => index => {
    if (state.pages) {
      return state.pages[index];
    }
    return null;
  },

  /**
   * Gets labels for an annotation set
   */
  labelsInAnnotationSet: state => annotationSet => {
    const labels = [];
    if (annotationSet && annotationSet.labels) {
      annotationSet.labels.map(label => {
        const newLabel = {
          ...label
        };
        labels.push(newLabel);
      });
    }
    return labels;
  },

  /**
   * Checks if theres a group of annotation sets and add an index number to them
   */
  numberOfAnnotationSetGroup: state => annotationSet => {
    let found = false;
    let value = 0;
    let index = 0;
    state.annotationSets.map(annotationSetTemp => {
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
  },

  /**
   * Checks if annotation is being edited
   */
  isAnnotationInEditMode:
    state =>
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
    }
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
  setEditMode: ({ commit }, option) => {
    commit("SET_EDIT_MODE", option);
  },
  disableEditMode: ({ commit }) => {
    commit("SET_EDIT_MODE", null);
  },
  setEditAnnotation: ({ commit }, values) => {
    commit("SET_EDIT_ANNOTATION", values);
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
  startRecalculatingAnnotations: ({ commit }) => {
    commit("SET_RECALCULATING_ANNOTATIONS", true);
  },
  endRecalculatingAnnotations: ({ commit }) => {
    commit("SET_RECALCULATING_ANNOTATIONS", false);
  },
  setMissingAnnotations: ({ commit }, missingAnnotations) => {
    commit("SET_MISSING_ANNOTATIONS", missingAnnotations);
  },
  setCurrentUser: ({ commit }, currentUser) => {
    commit("SET_CURRENT_USER", currentUser);
  },
  setEditingActive: ({ commit }, value) => {
    commit("SET_EDITING_ACTIVE", value);
  },
  setErrorMessage: ({ commit }, message) => {
    if (message) {
      commit("SET_SHOW_ERROR", true);
    } else {
      commit("SET_SHOW_ERROR", false);
    }

    commit("SET_ERROR_MESSAGE", message);
  },
  setAcceptAnnotation: ({ commit }, value) => {
    commit("SET_ACCEPT_ANNOTATION", value);
  },
  setDocumentError: ({ commit }, value) => {
    commit("SET_DOCUMENT_ERROR", value);
  },
  setImageLoaded: ({ commit }, value) => {
    commit("SET_IMAGE_LOADED", value);
  },
  setRejectAnnotation: ({ commit }, annotation) => {
    commit("SET_REJECT_ANNOTATION", annotation);
  },

  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchAnnotations: ({ commit, state }) => {
    return HTTP.get(`documents/${state.documentId}/`)
      .then(async response => {
        if (response.data.annotation_sets) {
          // set annotation sets
          commit("SET_ANNOTATION_SETS", response.data.annotation_sets);

          // set annotations & labels
          const annotations = [];
          const labels = [];
          response.data.annotation_sets.map(annotationSet => {
            annotationSet.labels.map(label => {
              annotations.push(...label.annotations);
              labels.push(label);
            });
          });
          commit("SET_ANNOTATIONS", annotations);
          commit("SET_LABELS", labels);

          // commit("SET_PAGES", []);

          const documentId = state.documentId;
          // fetch pages
          for (let i = 1; i <= response.data.number_of_pages; i++) {
            if (documentId === state.documentId) {
              // check if the document was not changed
              await HTTP.get(`documents/${documentId}/pages/${i}/`)
                .then(response => {
                  if (response.data && documentId === state.documentId) {
                    // if we already have the page in the state, update it in
                    // the pages array instead of creating a new one
                    const existingPageIndex = state.pages.findIndex(
                      p => p.number === i
                    );
                    if (existingPageIndex === -1) {
                      commit("ADD_PAGE", response.data);
                    } else {
                      let newPages = state.pages.slice(0);
                      newPages[i - 1] = response.data;
                      commit("SET_PAGES", newPages);
                    }
                  }
                })
                .catch(error => {
                  console.log(error, "Could not fetch pages from the backend");
                });
            } else {
              break;
            }
          }
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch document details from the backend");
      });
  },

  setDocumentFocusedAnnotation: ({ commit, state }, annotation) => {
    if (
      !state.documentFocusedAnnotation ||
      (annotation && state.documentFocusedAnnotation.id !== annotation.id)
    ) {
      commit("SET_DOCUMENT_FOCUSED_ANNOTATION", annotation);
    } else {
      commit("SET_DOCUMENT_FOCUSED_ANNOTATION", null);
    }
  },

  resetDocumentFocusedAnnotation: ({ commit }) => {
    commit("SET_DOCUMENT_FOCUSED_ANNOTATION", null);
  },

  createAnnotation: ({ commit }, annotation) => {
    return new Promise(resolve => {
      HTTP.post(`/annotations/`, annotation)
        .then(response => {
          commit("ADD_ANNOTATION", response.data);
          resolve(response.data);
        })
        .catch(error => {
          resolve(null);
          console.log(error);
        });
    });
  },

  updateAnnotation: ({ commit }, { updatedValues, annotationId }) => {
    return new Promise(resolve => {
      HTTP.patch(`/annotations/${annotationId}/`, updatedValues)
        .then(response => {
          if (response.status === 200) {
            commit("UPDATE_ANNOTATION", response.data);
            resolve(response.data);
          }
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  deleteAnnotation: ({ commit }, { annotationId }) => {
    return new Promise(resolve => {
      HTTP.delete(`/annotations/${annotationId}/`)
        .then(response => {
          commit("DELETE_ANNOTATION", annotationId);
          resolve(true);
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  updateDocument: ({ commit, state }, updatedDocument) => {
    return new Promise(resolve => {
      HTTP.patch(`/documents/${state.documentId}/`, updatedDocument)
        .then(response => {
          if (response.status === 200) {
            commit("SET_SELECTED_DOCUMENT", response.data);
            if (response.data.is_reviewed === true) {
              state.publicView = true;
            }
            resolve(true);
          }
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  fetchMissingAnnotations: ({ commit, state }) => {
    return HTTP.get(
      `documents/${state.documentId}/missing-annotations/?limit=100`
    )
      .then(response => {
        commit("SET_MISSING_ANNOTATIONS", response.data.results);
      })
      .catch(error => {
        console.log(error);
      });
  },

  addMissingAnnotation: ({ state }, missingAnnotation) => {
    return new Promise(resolve => {
      return HTTP.post(
        `documents/${state.documentId}/missing-annotations/`,
        missingAnnotation
      )
        .then(response => {
          if (response.status === 201) {
            resolve(true);
          }
        })
        .catch(error => {
          console.log(error);
          resolve(false);
        });
    });
  },

  deleteMissingAnnotation: ({ state }, id) => {
    return new Promise(resolve => {
      return HTTP.delete(
        `documents/${state.documentId}/missing-annotations/${id}/`
      )
        .then(response => {
          if (response.status === 204) {
            resolve(true);
          }
        })
        .catch(error => {
          console.log(error);
          resolve(false);
        });
    });
  },

  // Get document data
  fetchDocumentData: ({ commit, state }) => {
    return HTTP.get(`documents/${state.documentId}/`)
      .then(response => {
        commit("SET_SELECTED_DOCUMENT", response.data);

        if (response.data.is_reviewed === true) {
          state.publicView = true;
        }
      })
      .catch(error => {
        console.log(error);
      });
  },

  fetchCurrentUser: ({ commit }) => {
    return HTTP.get(`/auth/me/`).then(response => {
      commit("SET_CURRENT_USER", response.data.username);
    });
  },

  sleep: duration => {
    new Promise(resolve => setTimeout(resolve, duration));
  },

  pollDocumentEndpoint: ({ state, dispatch }, duration) => {
    return dispatch("fetchDocumentData").then(async () => {
      if (
        state.selectedDocument.status_data === 2 &&
        state.selectedDocument.labeling_available === 1
      ) {
        await dispatch("fetchAnnotations");
        await dispatch("endRecalculatingAnnotations");
        return true;
      } else if (state.selectedDocument.status_data === 111) {
        dispatch("setDocumentError", true);
        return false;
      } else {
        dispatch("sleep", duration).then(() =>
          dispatch("pollDocumentEndpoint", duration)
        );
      }
    });
  }
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },
  ADD_ANNOTATION: (state, annotation) => {
    state.annotations.push(annotation);
    state.annotationSets.map(annotationSet => {
      if (
        annotation.label_set &&
        annotationSet.label_set.id === annotation.label_set
      ) {
        annotationSet.labels.map(label => {
          if (annotation.label && annotation.label.id === label.id) {
            const exists = label.annotations.find(
              existingAnnotation => existingAnnotation.id === annotation.id
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
    const annotationToEdit = state.annotations.find(
      existingAnnotation => existingAnnotation.id === annotation.id
    );
    if (annotationToEdit) {
      const index = state.annotations.indexOf(annotationToEdit);
      state.annotations.splice(index, 1, annotation);
    }
  },
  DELETE_ANNOTATION: (state, annotationId) => {
    const indexOfAnnotationToDelete = state.annotations.findIndex(
      existingAnnotation => existingAnnotation.id === annotationId
    );
    if (indexOfAnnotationToDelete > -1) {
      state.annotations.splice(indexOfAnnotationToDelete, 1);
    }
    state.annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        const indexOfAnnotationInLabelToDelete = label.annotations.findIndex(
          existingAnnotation => existingAnnotation.id === annotationId
        );
        if (indexOfAnnotationInLabelToDelete > -1) {
          label.annotations.splice(indexOfAnnotationInLabelToDelete, 1);
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
  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },
  SET_EDIT_ANNOTATION: (state, { id, index, label, labelSet }) => {
    state.editAnnotation = {
      id,
      index,
      label,
      labelSet
    };
  },
  RESET_EDIT_ANNOTATION: state => {
    state.editAnnotation = {
      id: null,
      index: 0
    };
  },
  ADD_PAGE: (state, page) => {
    state.pages.push(page);
  },
  SET_PAGES: (state, pages) => {
    state.pages = pages;
  },
  SET_DOCUMENT_FOCUSED_ANNOTATION: (state, documentFocusedAnnotation) => {
    state.documentFocusedAnnotation = documentFocusedAnnotation;
  },
  SET_SELECTED_DOCUMENT: (state, document) => {
    state.selectedDocument = document;
  },
  SET_RECALCULATING_ANNOTATIONS: (state, recalculatingAnnotations) => {
    state.recalculatingAnnotations = recalculatingAnnotations;
  },
  SET_MISSING_ANNOTATIONS: (state, missingAnnotations) => {
    state.missingAnnotations = missingAnnotations;
  },
  SET_CURRENT_USER: (state, currentUser) => {
    state.currentUser = currentUser;
  },
  SET_EDITING_ACTIVE: (state, value) => {
    state.editingActive = value;
  },
  SET_SHOW_ERROR: (state, value) => {
    state.showError = value;
  },
  SET_ERROR_MESSAGE: (state, message) => {
    state.errorMessage = message;
  },
  SET_ACCEPT_ANNOTATION: (state, value) => {
    state.acceptAnnotation = value;
  },
  SET_DOCUMENT_ERROR: (state, value) => {
    state.showDocumentError = value;
  },
  SET_IMAGE_LOADED: (state, value) => {
    state.imageLoaded = value;
  },
  SET_REJECT_ANNOTATION: (state, annotation) => {
    state.rejectAnnotation = annotation;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
