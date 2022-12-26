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
  spanSelection: null,
  tableSelection: null,
  elementSelected: null, // selected element id
};

const getters = {
  isElementSelected: (state) => {
    return state.elementSelected;
  },
  isSelecting: (state) => {
    return state.isSelecting;
  },
  isEditingTable: (state) => {
    return state.tableSelection !== null;
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
  isValueArray: () => (value) => {
    return Array.isArray(value);
  },
};

const actions = {
  selectElement: ({ commit }, value) => {
    commit("ELEMENT_SELECTED", value);
  },

  disableSelection: ({ commit }) => {
    commit("ELEMENT_SELECTED", null);
    commit("RESET_SELECTION");
    commit("SET_SPAN_SELECTION", null);
    commit("SET_TABLE_SELECTION", null);
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

    dispatch("document/setSelectedEntities", null, { root: true });
  },

  endSelection: ({ commit, state }, end) => {
    const xDiff = Math.abs(state.selection.start.x - end.x);
    const yDiff = Math.abs(state.selection.start.y - end.y);
    // if start and end points are the same, or if we have a selection smaller than 5x5,
    // just reset
    if (
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

  setTableSelection: ({ commit }, tableSelection) => {
    commit("RESET_SELECTION");
    commit("SET_TABLE_SELECTION", tableSelection);
  },

  getTextFromBboxes: ({ commit, rootState }, box) => {
    return HTTP.post(`documents/${rootState.document.documentId}/bbox/`, {
      span: [box],
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
          commit("SET_SPAN_SELECTION", box);
        }
      })
      .catch((error) => {
        alert("Could not fetch the selected text from the backend");
      });
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
    state.selection.start = start;
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
  },
  SET_SPAN_SELECTION: (state, span) => {
    state.spanSelection = span;
  },
  SET_TABLE_SELECTION: (state, table) => {
    state.tableSelection = table;
  },
  SET_SELECTION: (state, selection) => {
    state.isSelecting = true;
    state.selection = selection;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
