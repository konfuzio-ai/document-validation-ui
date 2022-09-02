import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  loading: true,
  selectedCategory: null,
  categoryId: process.env.VUE_APP_CATEGORY_ID,
  documents: null,
  availableDocumentsList: [],
  categories: null
};

const getters = {
  /**
   * Get the category name for a given category ID
   */
  categoryName: state => categoryId => {
    if (categoryId && state.categories) {
      return state.categories.find(
        tempCategory => tempCategory.id == categoryId
      ).name;
    }
    return "";
  },

  documentListForUser: () => currentUser => {
    return state.availableDocumentsList.filter(
      document => document.assignee === currentUser
    );
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
  setAvailableDocumentsList: ({ commit }, availableDocumentsList) => {
    commit("SET_AVAILABLE_DOCUMENTS", availableDocumentsList);
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

  createAvailableDocumentsList: ({ state, dispatch }) => {
    const sleep = duration =>
      new Promise(resolve => setTimeout(resolve, duration));

    // Poll document data until the status_data is 2
    // and labeling is available (done)
    let count = 0;
    const pollUntilLabelingAvailable = duration => {
      let errors = 0;
      count += 1;

      return dispatch("fetchDocumentList").then(() => {
        for (let i = 0; i < state.documents.length; i++) {
          const found = state.availableDocumentsList.find(
            doc => doc.id === state.documents[i].id
          );

          if (found) {
            // If the document is already in the available docs array
            // we go to the next item
            continue;
          } else if (
            state.documents[i].status_data === 2 &&
            state.documents[i].labeling_available === 1
          ) {
            // add available doc to the end of the array
            state.availableDocumentsList.push(state.documents[i]);
          } else if (state.documents[i].status_data === 111) {
            // If error, add 1
            // Then go to next item
            errors += 1;
            continue;
          } else {
            // Some other situation, such as labeling not yet available
            // go to next item
            continue;
          }
        }

        // After looping, check if length of both arrays is different
        // And if the difference is due to errors or to docs not ready
        if (
          state.documents.length !== state.availableDocumentsList.length &&
          state.availableDocumentsList.length + errors !==
            state.documents.length
        ) {
          if (count >= 10) return true;

          // We poll the endpoint again
          return sleep(duration).then(() => {
            pollUntilLabelingAvailable(duration);
          });
        } else {
          return true;
        }
      });
    };

    // Poll as long as the lengths are different
    if (
      state.documents &&
      state.documents.length !== state.availableDocumentsList.length
    ) {
      let duration;
      if (count <= 5) {
        duration = 5000;
      } else if (count > 10) {
        duration = 20000;
      } else {
        duration = 10000;
      }

      pollUntilLabelingAvailable(duration);
    } else {
      return;
    }
  },

  fetchCategories: ({ commit, state }) => {
    return HTTP.get(`categories/?limit=100`)
      .then(async response => {
        if (response.data && response.data.results) {
          commit("SET_CATEGORIES", response.data.results);
          if (state.categoryId) {
            const selectedCategory = response.data.results.find(
              category => category.id == state.categoryId
            );
            commit("SET_SELECTED_CATEGORY", selectedCategory);
          }
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
  SET_AVAILABLE_DOCUMENTS: (state, availableDocumentsList) => {
    state.availableDocumentsList = availableDocumentsList;
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
