import BigNumber from "bignumber.js";
import {
  PIXEL_RATIO
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
  optimalScale: undefined,
  fit: undefined,
  currentPage: 1
};

const getters = {
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
  imageScale: state => page => {
    return new BigNumber(page.size[0])
      .div(page.original_size[0])
      .toNumber();
  },

  bboxToRect: (state, getters) => (page, bbox) => {
    const imageScale = getters.imageScale(page);
    const {
      x0,
      x1,
      y0,
      y1,
      top
    } = bbox;

    const rect = {
      // left
      x: new BigNumber(x0)
        .times(state.scale)
        .times(imageScale)
        .div(PIXEL_RATIO)
        .toNumber(),
      // top
      y: new BigNumber(top)
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
        .toNumber()
    };
    return rect;
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
    const y0 = pageHeight
      .minus(bottom)
      .dp(3, BigNumber.ROUND_DOWN)
      .toNumber();
    const y1 = pageHeight.minus(top).dp(3, BigNumber.ROUND_UP).toNumber();

    const bbox = {
      x0,
      x1,
      top,
      bottom,
      y0,
      y1,
      page_index: page.number - 1
    };

    return bbox;
  },
};

const actions = {
  updateScale({
    commit
  }, {
    scale,
    isOptimal = false
  }) {
    const roundedScale = floor(scale, 2);
    if (isOptimal) {
      commit("SET_OPTIMAL_SCALE", roundedScale);
    }
    commit("SET_SCALE", roundedScale);
  },

  updateFit({
    commit
  }, fit) {
    commit("SET_FIT", fit);
  },

  debounceUpdateCurrentPage: debounce(({
    commit,
    dispatch
  }, pageNumber) => {
    dispatch("updateCurrentPage", pageNumber);
  }, 300),

  updateCurrentPage({
    commit
  }, pageNumber) {
    commit("SET_CURRENT_PAGE", pageNumber);
  }
};

const mutations = {
  SET_SCALE: (state, scale) => {
    state.scale = scale;
  },

  SET_OPTIMAL_SCALE: (state, optimalScale) => {
    state.optimalScale = optimalScale;
  },

  SET_FIT: (state, fit) => {
    state.fit = fit;
  },

  SET_CURRENT_PAGE: (state, currentPage) => {
    state.currentPage = currentPage;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};