import myImports from "../api";

const HTTP = myImports.HTTP;

const selectionPadding = 1;

const state = {
  selection: {
    pageNumber: null,
    start: null,
    end: null
  },
  isSelecting: false,
  spanSelection: null,
  selectionEnabled: null
};

const getters = {
  isSelectionEnabled: state => {
    return state.selectionEnabled;
  },
  getSelectionForPage: state => pageNumber => {
    if (state.selection.pageNumber === pageNumber) {
      return state.selection;
    }
    return null;
  },
  isValueArray: () => value => {
    return Array.isArray(value);
  }
};

const actions = {
  enableSelection: ({
    commit
  }, value) => {
    commit("SELECTION_ENABLED", value);
    commit("RESET_SELECTION");
    commit("SET_SPAN_SELECTION", null);
  },

  disableSelection: ({
    commit
  }) => {
    commit("SELECTION_ENABLED", null);
    commit("RESET_SELECTION");
    commit("SET_SPAN_SELECTION", null);
  },

  startSelection: ({
    commit,
    dispatch
  }, {
    pageNumber,
    start
  }) => {
    commit("START_SELECTION", {
      pageNumber,
      start
    });

    dispatch("document/setSelectedEntity", null, {
      root: true
    });
  },

  moveSelection: ({
    commit,
    state
  }, points) => {
    // only apply when we have a large enough selection, otherwise we risk counting misclicks
    const xDiff = Math.abs(state.selection.start.x - points.end.x);
    const yDiff = Math.abs(state.selection.start.y - points.end.y);
    if (xDiff > 5 && yDiff > 5) {
      commit("MOVE_SELECTION", points);
    }
  },

  endSelection: ({
    commit,
    state
  }, end) => {
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

  setSelection: ({
    commit
  }, {
    span,
    selection
  }) => {
    commit("SET_SELECTION", selection);
    commit("SET_SPAN_SELECTION", span);
  },

  getTextFromBboxes: ({
    commit,
    rootState
  }, box) => {
    return HTTP.post(`documents/${rootState.document.documentId}/bbox/`, {
        span: [box]
      })
      .then(response => {
        if (response.data.span.length && response.data.span.length > 0) {
          /**
           * If we have a non-empty bboxes list, we assume there
           * is text here on the backend, so we just set
           * spanSelection to the response.
           */
          commit("SET_SPAN_SELECTION", response.data.span);
          console.log("result:", response.data.span)
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
      .catch(error => {
        alert("Could not fetch the selected text from the backend");
      });
  },
  setSpanSelection: ({
    commit
  }, span) => {
    commit("SET_SPAN_SELECTION", span);
  }
};

const mutations = {
  SELECTION_ENABLED: (state, value) => {
    state.selectionEnabled = value;
  },
  START_SELECTION: (state, {
    pageNumber,
    start
  }) => {
    state.selection.end = null;
    state.isSelecting = true;
    state.selection.pageNumber = pageNumber;
    state.selection.start = start;
  },
  MOVE_SELECTION: (state, points) => {
    const {
      start,
      end
    } = points;
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
  RESET_SELECTION: state => {
    state.isSelecting = false;
    state.selection.pageNumber = null;
    state.selection.start = null;
    state.selection.end = null;
  },
  SET_SPAN_SELECTION: (state, span) => {
    state.spanSelection = span;
  },
  SET_SELECTION: (state, selection) => {
    state.selection = selection;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};