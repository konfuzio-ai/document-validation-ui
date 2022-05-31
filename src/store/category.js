import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  loading: true,
  selectedCategory: null,
  categoryId: process.env.VUE_APP_CATEGORY_ID,
  documents: null,
  categories: null
};

const getters = {
  /**
   * Get the category name for a given category ID
   */
  categoryName: state => categoryId => {
    if (categoryId) {
      return state.categories.find(
        tempCategory => tempCategory.id == categoryId
      ).name;
    }
    return "";
  }
};

const actions = {
  startLoading: ({ commit }) => {
    commit("SET_LOADING", true);
  },
  endLoading: ({ commit }) => {
    commit("SET_LOADING", false);
  },
  setDocuments: ({ commit }, documents) => {
    commit("SET_DOCUMENTS", documents);
  },
  setCategories: ({ commit }, categories) => {
    commit("SET_CATEGORIES", categories);
  },
  setSelectedCategory: ({ commit }, category) => {
    commit("SET_SELECTED_CATEGORY", category);
  },
  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchDocumentList: ({ commit, state, rootState }) => {
    // TODO: add lazy loading
    return HTTP.get(`documents/?category=${state.categoryId}&limit=100`)
      .then(response => {
        if (response.data.results) {
          const documents = response.data.results;
          // set selected document in first position
          documents.forEach((document, i) => {
            if (document.id == rootState.document.documentId) {
              documents.splice(i, 1);
              documents.unshift(document);
              return;
            }
          });
          commit("SET_DOCUMENTS", documents);
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch document list from the backend");
      });
  },
  fetchCategories: ({ commit, state }) => {
    return HTTP.get(`categories/?limit=100`)
      .then(async response => {
        if (response.data && response.data.results) {
          commit("SET_CATEGORIES", response.data.results);
          const selectedCategory = response.data.results.find(
            category => category.id == state.categoryId
          );
          commit("SET_SELECTED_CATEGORY", selectedCategory);
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch categories from the backend");
      });
  }
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_SELECTED_CATEGORY: (state, category) => {
    state.selectedCategory = category;
  },
  SET_DOCUMENTS: (state, documents) => {
    state.documents = documents;
  },
  SET_CATEGORIES: (state, categories) => {
    state.categories = categories;
  }
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
};
