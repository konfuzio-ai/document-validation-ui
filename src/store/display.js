import BigNumber from "bignumber.js";
import {
  PIXEL_RATIO,
  VIEWPORT_RATIO,
  MINIMUM_APP_WIDTH,
  MINIMUM_OPTIMIZED_APP_WIDTH,
} from "../constants";
const debounce = (cb, duration) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      cb(...args);
    }, duration);
  };
};

const floor = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.floor(value * multiplier) / multiplier;
};

const state = {
  scale: undefined,
  fit: "width",
  currentPage: 1,
  optimalResolution: true,
  interactionBlocked: false,
  documentActionBar: null, // document action bar properties
  categorizeModalIsActive: false,
  pageChangedFromThumbnail: false,
  showAnnSetTable: null,
  showChooseLabelSetModal: null,
};

const getters = {
  isMinimumWidth: (state) => (width) => {
    return width >= MINIMUM_APP_WIDTH;
  },
  pageWidthScale: (state) => (elementsWidth, clientWidth, viewportWidth) => {
    return (
      ((clientWidth - elementsWidth) * PIXEL_RATIO * VIEWPORT_RATIO) /
      viewportWidth
    );
  },
  pageHeightScale: (state) => (clientHeight, viewportHeight) => {
    return (clientHeight * PIXEL_RATIO * VIEWPORT_RATIO) / viewportHeight;
  },
  visiblePageRange: (state, getters, rootState, rootGetters) => {
    const pageCount = rootGetters.pageCount;
    const previousPage = state.currentPage - 1 < 1 ? 1 : state.currentPage - 1;
    const nextPage =
      state.currentPage + 1 > pageCount ? pageCount : state.currentPage + 1;
    return [previousPage, state.currentPage, nextPage];
  },

  /**
   * The proportion between the original size of the page and the
   * image rendering.
   */
  imageScale: (state) => (page) => {
    return new BigNumber(page.size[0]).div(page.original_size[0]).toNumber();
  },
  bboxToPoint:
    (state, getters) =>
    (page, point, hasOffset = false) => {
      const imageScale = getters.imageScale(page);
      const { x, y } = point;
      const pageHeight = new BigNumber(page.original_size[1]);
      const newPoint = {
        // left
        x: new BigNumber(x)
          .minus(hasOffset ? 1 : 0)
          .times(state.scale)
          .times(imageScale)
          .div(PIXEL_RATIO)
          .toNumber(),
        // top
        y: pageHeight
          .minus(new BigNumber(y))
          .minus(hasOffset ? 17.1 : 0)
          .times(state.scale)
          .times(imageScale)
          .div(PIXEL_RATIO)
          .toNumber(),
      };
      return newPoint;
    },
  bboxToRect:
    (state, getters) =>
    (page, bbox, hasOffset = false) => {
      const imageScale = getters.imageScale(page);
      if (bbox.x0 && bbox.y0) {
        const { x0, x1, y0, y1 } = bbox;
        const pageHeight = new BigNumber(page.original_size[1]);
        const rect = {
          // left
          x: new BigNumber(x0)
            .minus(hasOffset ? 1 : 0)
            .times(state.scale)
            .times(imageScale)
            .div(PIXEL_RATIO)
            .toNumber(),
          // top
          y: pageHeight
            .minus(new BigNumber(y1))
            .minus(hasOffset ? 17.1 : 0)
            .times(state.scale)
            .times(imageScale)
            .div(PIXEL_RATIO)
            .toNumber(),
          width: new BigNumber(x1)
            .minus(x0)
            .abs()
            .times(state.scale)
            .times(imageScale)
            .div(PIXEL_RATIO)
            .toNumber(),
          height: new BigNumber(y1)
            .minus(y0)
            .times(state.scale)
            .times(imageScale)
            .div(PIXEL_RATIO)
            .toNumber(),
        };
        return rect;
      }
      return { x: 0, y: 0, width: 0, height: 0 };
    },
  clientToBbox: (state, getters) => (page, start, end) => {
    /**
     * The backend bbox's `y0` and `y1` attributes depend on knowing the
     * page's height.
     */
    const pageHeight = new BigNumber(page.original_size[1]);
    const imageScale = getters.imageScale(page);

    /**
     * We use `Math.min` and `Math.max` because depending on how the area
     * selection is made the `start` and `end` attributes might be reversed.
     */
    const x0 = new BigNumber(Math.min(start.x, end.x))
      .div(state.scale)
      .div(imageScale)
      .times(PIXEL_RATIO)
      .dp(3, BigNumber.ROUND_DOWN)
      .toNumber();
    const x1 = new BigNumber(Math.max(start.x, end.x))
      .div(state.scale)
      .div(imageScale)
      .times(PIXEL_RATIO)
      .dp(3, BigNumber.ROUND_UP)
      .toNumber();
    const top = new BigNumber(Math.min(start.y, end.y))
      .div(state.scale)
      .div(imageScale)
      .times(PIXEL_RATIO)
      .dp(3)
      .toNumber();
    const bottom = new BigNumber(Math.max(start.y, end.y))
      .div(state.scale)
      .div(imageScale)
      .times(PIXEL_RATIO)
      .dp(3)
      .toNumber();
    const y0 = pageHeight.minus(bottom).dp(3, BigNumber.ROUND_DOWN).toNumber();
    const y1 = pageHeight.minus(top).dp(3, BigNumber.ROUND_UP).toNumber();

    const bbox = {
      x0,
      x1,
      y0,
      y1,
      page_index: page.number - 1,
    };

    return bbox;
  },
};

const actions = {
  updateScale({ commit, getters }, { elementsWidth, client, viewport, scale }) {
    /**
     * Determine an ideal scale using viewport of document's first page, the pixel ratio
     * from the browser and a subjective scale factor based on the screen size.
     */
    switch (state.fit) {
      case "width":
        commit(
          "SET_SCALE",
          getters.pageWidthScale(elementsWidth, client.width, viewport.width)
        );
        break;
      case "auto":
        const pageWidthScale = getters.pageWidthScale(
          elementsWidth,
          client.width,
          viewport.width
        );
        const pageHeightScale = getters.pageWidthScale(
          client.height,
          viewport.height
        );
        const autoScale = Math.min(pageWidthScale, pageHeightScale);
        commit("SET_SCALE", autoScale);
        break;
      case "all": {
        commit(
          "SET_SCALE",
          getters.pageWidthScale(elementsWidth, client.width, viewport.width) -
            0.5
        );
        break;
      }
      case "custom": {
        if (scale) {
          commit("SET_SCALE", scale);
        }
        break;
      }
      default:
        console.log("No fit defined");
        break;
    }
  },

  updateFit({ commit }, fit) {
    commit("SET_FIT", fit);
  },

  debounceUpdateCurrentPage: debounce(({ commit, dispatch }, pageNumber) => {
    dispatch("updateCurrentPage", pageNumber);
  }, 300),

  updateCurrentPage({ commit }, pageNumber) {
    commit("SET_CURRENT_PAGE", pageNumber);
  },
  updateOptimalResolution({ commit }, width) {
    commit("SET_OPTIMAL_RESOLUTION", width >= MINIMUM_OPTIMIZED_APP_WIDTH);
  },
  showDocumentActionBar({ commit }, { icon, text, action, show, loading }) {
    commit(
      "SET_DOCUMENT_ACTION_BAR",
      show ? { icon, text, action, loading } : null
    );
  },
  showAnnSetTable({ commit }, tableSet) {
    commit("SET_ANN_SET_TABLE", tableSet);
  },
  showChooseLabelSetModal({ commit }, options) {
    commit("SET_SHOW_CHOOSE_LABEL_SET_MODAL", options);
  },
  toggleAnnSetTable({ commit }, tableSet) {
    commit("TOGGLE_ANN_SET_TABLE", tableSet);
  },
  setCategorizeModalIsActive: ({ commit }, value) => {
    commit("SET_CATEGORIZE_MODAL_IS_ACTIVE", value);
  },
  setPageChangedFromThumbnail: ({ commit }, value) => {
    commit("SET_PAGE_CHANGED_FROM_THUMBNAIL", value);
  },
};

const mutations = {
  SET_SCALE: (state, scale) => {
    state.scale = floor(scale, 2);
  },

  SET_FIT: (state, fit) => {
    state.fit = fit;
  },

  SET_OPTIMAL_RESOLUTION: (state, isOptimal) => {
    state.optimalResolution = isOptimal;
  },

  SET_CURRENT_PAGE: (state, currentPage) => {
    state.currentPage = currentPage;
  },

  SET_DOCUMENT_ACTION_BAR: (state, actionBar) => {
    state.documentActionBar = actionBar;
  },

  SET_ANN_SET_TABLE: (state, tableSet) => {
    state.showAnnSetTable = tableSet;
  },

  TOGGLE_ANN_SET_TABLE: (state, tableSet) => {
    if (state.showAnnSetTable) {
      state.showAnnSetTable = null;
    } else {
      state.showAnnSetTable = tableSet;
    }
  },

  SET_CATEGORIZE_MODAL_IS_ACTIVE: (state, value) => {
    state.categorizeModalIsActive = value;
  },
  SET_PAGE_CHANGED_FROM_THUMBNAIL: (state, value) => {
    state.pageChangedFromThumbnail = value;
  },
  SET_SHOW_CHOOSE_LABEL_SET_MODAL: (state, options) => {
    state.showChooseLabelSetModal = options;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
