import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  loading: true,
  docId: process.env.DOCUMENT_ID,
  pages: [],
  annotations: null,
  focusedAnnotation: {
    id: null,
    scroll: null
  }
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
   * A filtered version of `annotations` for the chosen page.
   * Include annotations that have *at least* one bbox in the page.
   * If the annotation's bboxes span multiple pages, each PDFPage receives
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

  setFocusedAnnotation: ({ commit, state }, annotation) => {
    if (state.focusedAnnotation.id !== annotation.id) {
      if (!annotation.span && !annotation.pageNumber && state.annotations) {
        const ann = state.annotations.find(a => a.id === annotation.id);
        if (ann) {
          annotation.span = ann.span;
          annotation.pageNumber = annotation.span[0].page_index + 1;
        } else {
          commit("SET_FOCUSED_ANNOTATION", { id: null });
          return;
        }
      }
      commit("SET_FOCUSED_ANNOTATION", annotation);
    } else {
      commit("SET_FOCUSED_ANNOTATION", { id: null });
    }
  },

  resetFocusedAnnotation: ({ commit }) => {
    commit("SET_FOCUSED_ANNOTATION", { id: null });
  },

  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */

  fetchDocument: async ({ commit, state }) => {
    return HTTP.get(`documents/${state.docId}`)
      .then(async response => {
        if (response.data.annotation_sets) {
          const annotations = [];
          response.data.annotation_sets.map(annotationSet => {
            annotationSet.labels.map(label => {
              label.annotations.map(annotation => {
                annotations.push(annotation);
              });
            });
          });
          commit("SET_ANNOTATIONS", annotations);

          // fetch pages
          for (let i = 1; i <= response.data.number_of_pages; i++) {
            await HTTP.get(`documents/${state.docId}/pages/${i}`)
              .then(response => {
                if (response.data) {
                  response.data.pageNumber = response.data.number;
                  delete response.data.number;
                  if (process.env.DOCUMENT_IMAGES_URL) {
                    response.data.image = `${process.env.DOCUMENT_IMAGES_URL}${response.data.image}`;
                  }
                  commit("ADD_PAGE", response.data);
                }
              })
              .catch(error => {
                console.log(error, "Could not fetch pages from the backend");
              });
          }
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch document data from the backend");
      });
  }
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_DOC_ID: (state, id) => {
    state.docId = id;
  },
  ADD_PAGE: (state, page) => {
    state.pages.push(page);
  },
  SET_ANNOTATIONS: (state, annotations) => {
    state.annotations = annotations;
  },
  SET_FOCUSED_ANNOTATION: (state, focusedAnnotation) => {
    state.focusedAnnotation = focusedAnnotation;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
