import myImports from "../api";

const HTTP = myImports.HTTP;

const config = {
  headers: {
    Authorization: `Token ${process.env.VUE_APP_GUEST_USER_TOKEN}`
  }
};

const state = {
  selectedCategory: null,
  categoryId: process.env.VUE_APP_CATEGORY_ID,
  documents: null
};

const getters = {
  /**
   * Document with processed information
   */
  document: state => document => {
    if (process.env.VUE_APP_DOCUMENT_IMAGES_URL) {
      document.thumbnail_url = `${process.env.VUE_APP_DOCUMENT_IMAGES_URL}${document.thumbnail_url}`;
    }
    return document;
  }
};

const actions = {
  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchDocumentList: ({ commit, state, getters }) => {
    return HTTP.get(`documents/?category=${state.categoryId}`, config)
      .then(response => {
        if (response.data.results) {
          const documents = response.data.results.map(document => {
            return getters.document(document);
          });
          commit("SET_DOCUMENTS", documents);
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
  getters,
  actions,
  mutations
};
