import myImports from "../api";

const HTTP = myImports.HTTP;

const config = {
  headers: {
    token: process.env.VUE_APP_GUEST_USER_TOKEN
  }
};

const state = {
  selectedCategory: null,
  categoryId: process.env.VUE_APP_CATEGORY_ID,
  documents: null
};

const actions = {
  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchDocumentList: ({ commit, state }) => {
    return HTTP.get(`documents/?category=${state.categoryId}`, config)
      .then(response => {
        if (response.data.results) {
          commit("SET_DOCUMENTS", response.data.results);
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch document list from the backend");
      });
  },
  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchCategory: ({ commit }) => {
    return HTTP.get(`categories/${state.categoryId}/`, config)
      .then(async response => {
        if (response.data) {
          commit("SET_SELECTED_CATEGORY", response.data);
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch category details from the backend");
      });
  }
};

const mutations = {
  SET_SELECTED_CATEGORY: (state, category) => {
    state.selectedCategory = category;
  },
  SET_DOCUMENTS: (state, documents) => {
    state.documents = documents;
  }
};

export default {
  namespaced: true,
  state,
  actions,
  mutations
};
