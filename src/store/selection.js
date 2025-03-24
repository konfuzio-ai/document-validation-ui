import myImports from "../api";

const HTTP = myImports.HTTP;

const selectionPadding = 1;

const state = {
  selection: {
    pageNumber: null,
    start: null,
    end: null,
    custom: false, // if the box was created by user in document or it comes from an annotation
    placeholderBox: null, // show a not editable placeholder box
  },
  isSelecting: false,
  spanSelection: null,
  elementSelected: null, // selected element id
  selectedEntities: [],
};

const getters = {
  isElementSelected: (state) => {
    return state.elementSelected;
  },
  isSelecting: (state) => {
    return state.isSelecting;
  },
  isSelectionValid: (state) => {
    /**
     * `endSelection` will reset everything in case of invalid selection.
     * Check the existence of `selection.end` before requesting the
     * content from the backend.
     * */
    return state.selection && state.selection.end;
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
};

const actions = {
  selectElement: ({ commit }, value) => {
    commit("RESET_SELECTION");
    commit("SET_SPAN_SELECTION", null);
    commit("ELEMENT_SELECTED", value);
  },

  disableSelection: ({ commit }) => {
    commit("ELEMENT_SELECTED", null);
    commit("RESET_SELECTION");
    commit("SET_SPAN_SELECTION", null);
  },

  startSelection: ({ commit }, { pageNumber, start }) => {
    commit("START_SELECTION", {
      pageNumber,
      start,
    });
  },

  moveSelection: ({ commit, state, dispatch }, points) => {
    // only apply when we have a large enough selection, otherwise we risk counting misclicks
    const xDiff = Math.abs(state.selection.start.x - points.end.x);
    const yDiff = Math.abs(state.selection.start.y - points.end.y);
    if (xDiff > 5 && yDiff > 5) {
      commit("MOVE_SELECTION", points);
    }

    commit("SET_SELECTED_ENTITIES", null);
  },

  endSelection: ({ commit, state }, end) => {
    let xDiff;
    let yDiff;

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
  },

  setSelection: ({ commit }, { span, selection }) => {
    commit("SET_SELECTION", selection);
    commit("SET_SPAN_SELECTION", span);
  },

  setSelectedEntities: ({ commit }, entities) => {
    commit("SET_SELECTED_ENTITIES", entities);
  },

  getTextFromBboxes: ({ commit, rootState }, { box, entities }) => {
    let span;

    if (entities) {
      span = box.flatMap((s) => {
        return s.original;
      });
    } else {
      span = [box];
    }

    return HTTP.post(`documents/${rootState.document.documentId}/bbox/`, {
      span,
    })
      .then((response) => {
        if (response.data.span.length && response.data.span.length > 0) {
          /**
           * If we have a non-empty bboxes list, we assume there
           * is text here on the backend, so we just set
           * spanSelection to the response.
           */
          commit("SET_SPAN_SELECTION", response.data.span);
        } else {
          /**
           * Otherwise, we assume the backend can't identify text
           * on this area, so we set our bbox into spanSelection
           * ready to be passed back to the backend when creating
           * an annotation on this empty area, adding the offset_string
           * attribute, ready to be filled.
           */
          commit("SET_SPAN_SELECTION", span);
        }
      })
      .catch((error) => {
        alert("Could not fetch the selected text from the backend");
      });
  },

  getTextFromEntities: ({ commit, dispatch }, selectedEntities) => {
    if (!selectedEntities) return;

    return dispatch("getTextFromBboxes", {
      box: selectedEntities,
      entities: true,
    });
  },

  entitySelection: ({ commit, dispatch, state }, entities) => {
    if (entities.length === 0) {
      commit("SET_SELECTED_ENTITIES", []);
    } else {
      commit("SET_SELECTED_ENTITIES", entities);

      dispatch("document/setAnnotationId", null, {
        root: true,
      });
      dispatch("getTextFromBboxes", {
        box: entities,
        entities: true,
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

    let entities = [];
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
    } else {
      commit("SET_SELECTED_ENTITIES", entities);

      dispatch("document/setAnnotationId", null, {
        root: true,
      });
      dispatch("getTextFromBboxes", {
        box: entities,
        entities: true,
      });
    }
  },

  setSpanSelection: ({ commit }, span) => {
    commit("SET_SPAN_SELECTION", span);
  },
};

const mutations = {
  ELEMENT_SELECTED: (state, value) => {
    state.elementSelected = value;
  },
  START_SELECTION: (state, { pageNumber, start }) => {
    state.selection.end = null;
    state.isSelecting = true;
    state.selection.pageNumber = pageNumber;
    state.selection.custom = true;
    state.selection.start = start;
    state.selection.placeholderBox = null;
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
    state.isSelecting = false;
    state.selection.pageNumber = null;
    state.selection.start = null;
    state.selection.end = null;
    state.selection.placeholderBox = null;
  },
  SET_SPAN_SELECTION: (state, span) => {
    console.log("span", span);
    state.spanSelection = span;
  },
  SET_SELECTION: (state, selection) => {
    state.selection = selection;
  },
  SET_SELECTED_ENTITIES: (state, entities) => {
    state.selectedEntities = entities;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
