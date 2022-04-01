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
  }
};

const actions = {
  updateScale({ commit }, { scale, isOptimal = false }) {
    const roundedScale = floor(scale, 2);
    if (isOptimal) {
      commit("SET_OPTIMAL_SCALE", roundedScale);
    }
    commit("SET_SCALE", roundedScale);
  },

  updateFit({ commit }, fit) {
    commit("SET_FIT", fit);
  },

  debounceUpdateCurrentPage: debounce(({ commit, dispatch }, pageNumber) => {
    dispatch("updateCurrentPage", pageNumber);
  }, 300),

  updateCurrentPage({ commit }, pageNumber) {
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
