import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentFocusedAnnotation: null,
  loading: true,
  pages: [],
  activeAnnotationSet: null,
  annotationSets: null,
  annotations: null,
  documentId: process.env.VUE_APP_DOCUMENT_ID,
  sidebarAnnotationSelected: null,
  showDeletedAnnotations: false,
  selectedDocument: null,
  recalculatingAnnotations: false
};

const getters = {
  /**
   * Get annotation sets grouped if there's one with the multiple
   * annotations property enabled.
   */
  groupedAnnotationSets: state => {
    if (state.annotationSets) {
      const tempAnnotationSets = [];
      state.annotationSets.map(annotationSet => {
        // don't add empty label sets
        if (annotationSet.labels.length > 0) {
          // check if the same label set already exists in the array
          const existingAnnotationSet = tempAnnotationSets.find(
            el => el.label_set.id === annotationSet.label_set.id
          );
          if (existingAnnotationSet && existingAnnotationSet.group) {
            existingAnnotationSet.group.push({
              id: annotationSet.id,
              label_set: annotationSet.label_set,
              labels: annotationSet.labels
            });
          } else {
            // add it to the annotation set array
            annotationSet.group = [
              {
                id: annotationSet.id,
                label_set: annotationSet.label_set,
                labels: annotationSet.labels
              }
            ];
            tempAnnotationSets.push(annotationSet);
          }
        }
      });
      return tempAnnotationSets;
    }
    return null;
  },

  /**
   * Get annotations from the given annotation set, if there's none
   * return null to show the empty state
   */
  annotationsInAnnotationSet: state => annotationSet => {
    if (annotationSet) {
      const annotations = [];
      annotationSet.labels.map(label => {
        //add empty labels
        if (label.annotations.length === 0) {
          annotations.push({
            label_name: label.name,
            label_description: label.description,
            label_id: label.id,
            // TODO: to be removed on next version
            isOpen: false
          });
        } else {
          label.annotations.map(annotation => {
            // check if annotation is not in deleted state
            if (
              !(annotation.revised === true && annotation.is_correct === false)
            ) {
              annotations.push({
                ...annotation,
                label_name: label.name,
                label_description: label.description,
                label_id: label.id,
                // TODO: to be removed on next version
                isOpen: false
              });
            }
          });
        }
      });
      return annotations;
    }
    return null;
  },

  /**
   * All annotations with required information
   */
  annotations: state => annotationSets => {
    const annotations = [];
    annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        label.annotations.map(annotation => {
          const cloneAnnotation = Object.assign({}, annotation);
          // save annotation set info in the annotation
          cloneAnnotation.annotation_set = annotationSet;
          annotations.push(cloneAnnotation);
        });
      });
    });
    return annotations;
  },

  /**
   * Get total annotations number in an annotation set
   */
  totalAnnotationsInAnnotationSet: (state, getters) => annotationSet => {
    let counter = 0;
    if (annotationSet && annotationSet.group) {
      // search in every annotation group for how many annotations exist
      annotationSet.group.map(tempAnnotationSet => {
        tempAnnotationSet.labels.map(label => {
          if (label.annotations.length === 0) {
            // count label as an empty annotation
            counter = counter + 1;
          } else {
            counter = counter + label.annotations.length;
          }
        });
      });
    }
    return counter;
  },
  /**
   * Get total perfect confidence number in an annotation set
   */
  perfectConfidenceTotalInAnnotationSet: state => annotationSet => {
    let counter = 0;
    if (annotationSet && annotationSet.group) {
      // search in every annotation group for how many annotations
      // with a perfect confidence exist
      annotationSet.group.map(tempAnnotationSet => {
        tempAnnotationSet.labels.map(label => {
          label.annotations.map(annotation => {
            counter = counter + (annotation.accuracy === 1 ? 1 : 0);
          });
        });
      });
    }
    return counter;
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
   * A filtered version of `annotations` for the chosen page.
   * Include annotations that have *at least* one bbox in the page.
   * If the annotation's bboxes span multiple pages, each DocumentPage receives
   * it and only shows the ones that match the pageNumber.
   */
  annotationsForPage: state => pageNumber => {
    const annotations = [];
    if (state.annotations) {
      state.annotations.map(annotation => {
        if (annotation.span.find(span => span.page_index + 1 === pageNumber)) {
          annotations.push(annotation);
        }
      });
    }
    return annotations;
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
    commit("SET_DOC_ID", id);
  },
  setSidebarAnnotationSelected: ({ commit }, annotation) => {
    commit("SET_ANNOTATION_SELECTED", annotation);
  },
  setActiveAnnotationSet: ({ commit }, annotationSet) => {
    commit("SET_ACTIVE_ANNOTATION_SET", annotationSet);
  },
  setAnnotationSets: ({ commit }, annotationSets) => {
    commit("SET_ANNOTATION_SETS", annotationSets);
  },
  setAnnotations: ({ commit }, annotations) => {
    commit("SET_ANNOTATIONS", annotations);
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

  createAnnotation: ({ state }, annotation) => {
    return new Promise(resolve => {
      HTTP.post(`/documents/${state.documentId}/annotations/`, annotation)
        .then(response => {
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
  }
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },
  SET_ACTIVE_ANNOTATION_SET: (state, annotationSet) => {
    state.activeAnnotationSet = annotationSet;
  },
  SET_ANNOTATIONS: (state, annotations) => {
    state.annotations = annotations;
  },
  SET_ANNOTATION_SETS: (state, annotationSets) => {
    state.annotationSets = annotationSets;
  },
  SET_ANNOTATION_SELECTED: (state, annotation) => {
    state.sidebarAnnotationSelected = annotation;
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
