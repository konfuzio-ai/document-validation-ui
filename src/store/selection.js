import myImports from "../api";

const HTTP = myImports.HTTP;

const selectionPadding = 1;

const state = {
  selection: {
    pageNumber: null,
    start: null,
    end: null,
  },
  isSelecting: false,
  spanSelection: [],
  placeholderSelection: [],
  selectedEntities: [],
  spanLoading: false,
};

const getters = {
  isSelectionValid: (state) => {
    /**
     * `endSelection` will reset everything in case of invalid selection.
     * Check the existence of `selection.end` before requesting the
     * content from the backend.
     * */
    return state.selection && state.selection.end != null;
  },

  getSelectionForPage: (state) => (pageNumber) => {
    if (state.selection.pageNumber === pageNumber) {
      return state.selection;
    }
    return null;
  },

  /**
   * Get entities inside a box
   */
  entitiesOnSelection: (state) => (box, page) => {
    return page.entities.filter(
      (entity) =>
        box.x0 <= entity.x0 &&
        box.x1 >= entity.x1 &&
        box.y0 <= entity.y0 &&
        box.y1 >= entity.y1
    );
  },
  spanSelectionsForPage: (state) => (page) => {
    return state.spanSelection.filter(
      (span) => page.number === span.page_index + 1
    );
  },
  placeholderSelectionForPage: (state) => (page) => {
    return state.placeholderSelection.filter(
      (span) => page.number === span.page_index + 1
    );
  },
};

const actions = {
  disableSelection: ({ commit }) => {
    commit("RESET_SELECTION");
    commit("SET_SELECTED_ENTITIES", []);
    commit("SET_SPAN_SELECTION", []);
    commit("SET_PLACEHOLDER_SELECTION", []);
  },

  startSelection: ({ commit }, { pageNumber, start }) => {
    commit("START_SELECTION", {
      pageNumber,
      start,
    });
  },

  moveSelection: ({ commit, state, dispatch }, points) => {
    // only apply when we have a large enough selection, otherwise we risk counting misclicks
    if (state.selection && state.selection.start) {
      const xDiff = Math.abs(state.selection.start.x - points.end.x);
      const yDiff = Math.abs(state.selection.start.y - points.end.y);
      if (xDiff > 5 && yDiff > 5) {
        commit("MOVE_SELECTION", points);
      }
    }
  },

  endSelection: ({ commit, state }, end) => {
    let xDiff;
    let yDiff;

    if (state.selection && state.selection.start) {
      if (end) {
        xDiff = Math.abs(state.selection.start.x - end.x);
        yDiff = Math.abs(state.selection.start.y - end.y);
      }

      // if "end" is not provided, start and end points are the same, or if we have a selection smaller than 5x5,
      // just reset
      if (
        !end ||
        (yDiff <= 5 && xDiff <= 5) ||
        (state.selection.start.x === end.x && state.selection.start.y == end.y)
      ) {
        commit("RESET_SELECTION");
      } else {
        state.selection.start.x = state.selection.start.x - selectionPadding;
        state.selection.start.y = state.selection.start.y - selectionPadding;

        end.x = end.x + selectionPadding;
        end.y = end.y + selectionPadding;

        commit("END_SELECTION", end);
      }
    }
  },

  setSelectedEntities: ({ commit }, entities) => {
    commit("SET_SELECTED_ENTITIES", entities);
  },

  getTextFromBboxes: ({ commit, rootState }, span) => {
    commit("SET_SPAN_LOADING", true);
    return new Promise((resolve, reject) => {
      HTTP.post(`documents/${rootState.document.documentId}/bbox/`, {
        span,
      })
        .then((response) => {
          if (response.data.span.length && response.data.span.length > 0) {
            /**
             * If we have a non-empty bboxes list, we assume there
             * is text here on the backend, so we just set
             * spanSelection to the response.
             */
            resolve(response.data.span);
          } else {
            /**
             * Otherwise, we assume the backend can't identify text
             * on this area, so we set our bbox into spanSelection
             * ready to be passed back to the backend when creating
             * an annotation on this empty area, adding the offset_string
             * attribute, ready to be filled.
             */
            resolve(span);
          }
        })
        .catch((error) => {
          alert("Could not fetch the selected text from the backend");
          reject(error);
        })
        .finally(() => {
          commit("SET_SPAN_LOADING", false);
        });
    });
  },

  entitySelection: ({ commit, dispatch, state }, { entities, selection }) => {
    if (entities.length === 0) {
      if (selection) {
        dispatch("getTextFromBboxes", [selection]).then((spans) => {
          commit("SET_SPAN_SELECTION", spans);
        });
      } else {
        commit("RESET_SELECTION");
        commit("SET_SPAN_SELECTION", []);
      }
      commit("SET_SELECTED_ENTITIES", []);
    } else {
      commit("SET_SELECTED_ENTITIES", entities);

      dispatch("document/setAnnotationId", null, {
        root: true,
      });
      let span;
      if (entities) {
        span = entities.flatMap((s) => {
          return s.original;
        });
      } else {
        span = [entities];
      }
      commit("SET_SPAN_SELECTION", span);
      dispatch("getTextFromBboxes", span).then((spans) => {
        commit("SET_SPAN_SELECTION", spans);
      });
    }
  },

  entityClick: ({ commit, dispatch, state }, entity) => {
    // Check if we are creating a new Annotation
    // or if we are removing a previously selected entity
    // or editing empty one
    const found = state.selectedEntities.find(
      (entityToFind) =>
        entity.scaled.width === entityToFind.scaled.width &&
        entity.original.offset_string === entityToFind.original.offset_string
    );

    let entities = state.selectedEntities;
    if (found) {
      entities = [
        ...state.selectedEntities.filter(
          (entityToFilter) =>
            entityToFilter.scaled.width !== entity.scaled.width &&
            entityToFilter.original.offset_string !==
              entity.original.offset_string
        ),
      ];
    } else {
      entities.push(entity);
    }

    if (entities.length === 0) {
      commit("SET_SELECTED_ENTITIES", []);
      commit("SET_SPAN_SELECTION", []);
    } else {
      commit("SET_SELECTED_ENTITIES", entities);

      dispatch("document/setAnnotationId", null, {
        root: true,
      });

      let span;

      if (entities) {
        span = entities.flatMap((s) => {
          return s.original;
        });
      } else {
        span = [entities];
      }
      commit("SET_SPAN_SELECTION", span);
    }
  },

  setSpanSelection: ({ commit }, span) => {
    commit("SET_SPAN_SELECTION", span);
  },
  setPlaceholderSelection: ({ commit }, span) => {
    commit("SET_PLACEHOLDER_SELECTION", span);
  },
};

const mutations = {
  START_SELECTION: (state, { pageNumber, start }) => {
    state.selection.end = null;
    state.selection.pageNumber = pageNumber;
    state.selection.start = start;
    state.isSelecting = true;
  },
  MOVE_SELECTION: (state, points) => {
    const { start, end } = points;
    if (start) {
      state.selection.start = start;
    }
    if (end) {
      state.selection.end = end;
    }
  },
  END_SELECTION: (state, end) => {
    state.selection.end = end;
    state.isSelecting = false;
  },
  RESET_SELECTION: (state) => {
    state.selection.pageNumber = null;
    state.selection.start = null;
    state.selection.end = null;
  },
  SET_SPAN_SELECTION: (state, span) => {
    if (!span) {
      state.spanSelection = [];
    } else {
      state.spanSelection = span;
    }
  },
  ADD_SPAN_SELECTION: (state, span) => {
    state.spanSelection.push(span);
  },
  SET_PLACEHOLDER_SELECTION: (state, span) => {
    if (!span) {
      state.placeholderSelection = [];
    } else {
      state.placeholderSelection = span;
    }
  },
  ADD_PLACEHOLDER_SELECTION: (state, span) => {
    state.placeholderSelection.push(span);
  },
  SET_SELECTED_ENTITIES: (state, entities) => {
    if (!entities) {
      state.selectedEntities = [];
    } else {
      state.selectedEntities = entities;
    }
  },
  SET_SPAN_LOADING: (state, loading) => {
    state.spanLoading = loading;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
