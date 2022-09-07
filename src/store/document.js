import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentFocusedAnnotation: null,
  loading: true,
  pages: [],
  annotationSets: null,
  annotations: null,
  labels: [],
  documentId: process.env.VUE_APP_DOCUMENT_ID,
  sidebarAnnotationSelected: null,
  showDeletedAnnotations: false,
  selectedDocument: null,
  recalculatingAnnotations: false,
  editAnnotation: {
    id: null,
    index: 0
  },
  missingAnnotations: [],
  // TODO: remove this after the reject label endpoint is merged in testing
  showRejectedLabels:
    process.env.VUE_APP_SHOW_REJECT_LABELS &&
    process.env.VUE_APP_SHOW_REJECT_LABELS == "true",
  currentUser: null
};

const getters = {
  /**
   * All annotations with required information
   */
  annotations: state => annotationSets => {
    const annotations = [];
    annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        annotations.push(...label.annotations);
      });
    });
    return annotations;
  },

  labels: state => annotationSets => {
    const labels = [];
    annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        labels.push(label);
      });
    });
    return labels;
  },

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
  setEditAnnotation: ({ commit }, values) => {
    commit("SET_EDIT_ANNOTATION", values);
  },
  resetEditAnnotation: ({ commit }) => {
    commit("RESET_EDIT_ANNOTATION");
  },
  addAnnotation: ({ commit }, annotation) => {
    commit("ADD_ANNOTATION", annotation);
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

  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchAnnotations: ({ commit, state, getters }) => {
    return HTTP.get(
      `documents/${state.documentId}/${
        !state.showDeletedAnnotations ? "?revised=true&is_correct=false" : ""
      }`
    )
      .then(async response => {
        if (response.data.annotation_sets) {
          commit("SET_ANNOTATION_SETS", response.data.annotation_sets);
          commit(
            "SET_ANNOTATIONS",
            getters.annotations(response.data.annotation_sets)
          );
          commit("SET_LABELS", getters.labels(response.data.annotation_sets));
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

  createAnnotation: ({ state, commit }, annotation) => {
    return new Promise(resolve => {
      HTTP.post(`/documents/${state.documentId}/annotations/`, annotation)
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

  updateAnnotation: ({ state }, { updatedValues, annotationId }) => {
    return new Promise(resolve => {
      HTTP.patch(
        `/documents/${state.documentId}/annotations/${annotationId}/`,
        updatedValues
      )
        .then(response => {
          if (response.status === 200) {
            const annotation = state.annotations.find(
              annotation => annotation.id === response.data.id
            );
            annotation.span = response.data.span;

            resolve(true);
          }
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
    return HTTP.get(`documents/${state.documentId}/missing-annotations/`)
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
      })
      .catch(error => {
        console.log(error);
      });
  },

  updatePageRotation: ({ state }, changedRotations) => {
    return new Promise(resolve => {
      HTTP.post(`/documents/${state.documentId}/rotate/`, changedRotations)
        .then(response => {
          if (response.status === 204) {
            resolve(true);
          }
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  fetchCurrentUser: ({ commit }) => {
    return HTTP.get(`/auth/me/`).then(response => {
      commit("SET_CURRENT_USER", response.data.username);
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
  SET_EDIT_ANNOTATION: (state, { id, index }) => {
    state.editAnnotation = {
      id,
      index
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
