import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  loading: true,
  docId: process.env.VUE_APP_DOCUMENT_ID,
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
   * Annotations list with required information
   */
  annotationsInAnnotationSets: state => annotationSets => {
    const annotations = [];
    annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        label.annotations.map(annotation => {
          // save annotation set info in annotation
          annotation.annotation_set = annotationSet;
          annotations.push(annotation);
        });
      });
    });
    return annotations;
  },
  /**
   * Page with processed information
   */
  page: state => page => {
    page.pageNumber = page.number;
    delete page.number;
    if (process.env.VUE_APP_DOCUMENT_IMAGES_URL) {
      page.image = `${process.env.VUE_APP_DOCUMENT_IMAGES_URL}${page.image}`;
    }
    return page;
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

  setAnnotations: ({ commit }, annotations) => {
    commit("SET_ANNOTATIONS", annotations);
  },

  setPages: ({ commit }, pages) => {
    commit("SET_PAGES", pages);
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

  fetchDocument: async ({ commit, state, getters }) => {
    return HTTP.get(`documents/${state.docId}`)
      .then(async response => {
        if (response.data.annotation_sets) {
          commit(
            "SET_ANNOTATIONS",
            getters.annotationsInAnnotationSets(response.data.annotation_sets)
          );
          commit("SET_PAGES", []);

          // fetch pages
          for (let i = 1; i <= response.data.number_of_pages; i++) {
            await HTTP.get(`documents/${state.docId}/pages/${i}`)
              .then(response => {
                if (response.data) {
                  commit("ADD_PAGE", getters.page(response.data));
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
  SET_PAGES: (state, pages) => {
    state.pages = pages;
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
