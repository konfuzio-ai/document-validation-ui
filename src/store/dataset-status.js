import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  loading: true,
  selectedStatus: null,
  documentId: process.env.VUE_APP_DOCUMENT_ID
};

const actions = {
  startLoading: ({ commit }) => {
    commit("SET_LOADING", true);
  },
  endLoading: ({ commit }) => {
    commit("SET_LOADING", false);
  },
  setSelectedDatasetStatus: ({ commit }, status) => {
    commit("SET_SELECTED_DATASET_STATUS", status);
  },
  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchDatasetStatus: ({ commit }) => {
    return HTTP.get(`categories/${state.categoryId}/`)
      .then(async response => {
        if (response.data) {
          commit("SET_SELECTED_DATASET_STATUS", response.data);
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch category details from the backend");
      });
  }
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_SELECTED_DATASET_STATUS: (state, status) => {
    state.selectedStatus = status;
  }
};

export default {
  state,
  actions,
  mutations
};
