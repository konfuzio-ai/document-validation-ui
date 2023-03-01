import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentsInProject: [],
  documentsAvailableToReview: [], // filtered by user
  categories: null,
};

const getters = {
  /**
   * Get the category name for a given category ID
   */
  categoryName: (state) => (categoryId) => {
    if (categoryId && state.categories) {
      return state.categories.find(
        (tempCategory) => tempCategory.id == categoryId
      ).name;
    }
    return "";
  },

  /**
   * Get the category for a given category ID
   */
  category: (state) => (categoryId) => {
    if (categoryId && state.categories) {
      return state.categories.find(
        (tempCategory) => tempCategory.id == categoryId
      );
    }
    return null;
  },

  projectHasSingleCategory: (state) => () => {
    return state.categories && state.categories.length === 1;
  },
};

const actions = {
  setDocumentsInProject: ({ commit }, documents) => {
    commit("SET_DOCUMENTS_IN_PROJECT", documents);
  },
  setDocumentsAvailableToReview: ({ commit }, documentsAvailableToReview) => {
    commit("SET_AVAILABLE_DOCUMENTS", documentsAvailableToReview);
  },
  setCategories: ({ commit }, categories) => {
    commit("SET_CATEGORIES", categories);
  },
  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchDocumentList: ({ commit, rootState }, categoryId) => {
    return HTTP.get(
      `documents/?category=${categoryId}&assignee=${rootState.project.currentUser}`
    )
      .then((response) => {
        if (response.data.results) {
          commit("SET_DOCUMENTS_IN_PROJECT", response.data.results);
        }
      })
      .catch((error) => {
        console.log(error, "Could not fetch document list from the backend");
      });
  },

  createAvailableDocumentsList: (
    { commit, state, dispatch, rootGetters },
    { categoryId, user, poll }
  ) => {
    const sleep = (duration) =>
      new Promise((resolve) => setTimeout(resolve, duration));

    // Poll document data until the status_data is 2
    // and labeling is available (done)
    let count = 0;
    const pollUntilLabelingAvailable = (duration) => {
      let errors = 0;
      count += 1;

      return dispatch("fetchDocumentList", categoryId).then(() => {
        for (let i = 0; i < state.documentsInProject.length; i++) {
          const found = state.documentsAvailableToReview.find(
            (doc) => doc.id === state.documentsInProject[i].id
          );

          if (found) {
            // If the document is already in the available docs array
            // we go to the next item
            continue;
          } else if (
            rootGetters["document/isDocumentReadyToBeReviewed"](
              state.documentsInProject[i]
            )
          ) {
            // add available doc to the end of the array
            commit("ADD_AVAILABLE_DOCUMENT", state.documentsInProject[i]);
          } else if (
            rootGetters["document/documentHadErrorDuringExtraction"](
              state.documentsInProject[i]
            )
          ) {
            dispatch("document/setDocumentError", true);
            // If error, add 1
            // Then go to next item
            errors += 1;
            continue;
          } else {
            // Some other situation, such as labeling not yet available
            // go to next item
            // TODO: we should only poll the documents that are not yet available
            continue;
          }
        }
        // After looping, check if length of both arrays is different
        // And if the difference is due to errors or to docs not ready
        if (
          poll &&
          state.documentsInProject.length !==
            state.documentsAvailableToReview.length &&
          state.documentsAvailableToReview.length + errors !==
            state.documentsInProject.length
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
      state.documentsInProject.length === 0 ||
      state.documentsInProject.length !==
        state.documentsAvailableToReview.length
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

  fetchCategories: ({ commit }, projectId) => {
    return HTTP.get(`categories/?limit=100&project=${projectId}`)
      .then(async (response) => {
        if (response.data && response.data.results) {
          commit("SET_CATEGORIES", response.data.results);
        }
      })
      .catch((error) => {
        console.log(error, "Could not fetch categories from the backend");
      });
  },
};

const mutations = {
  SET_DOCUMENTS_IN_PROJECT: (state, documents) => {
    state.documentsInProject = documents;
  },
  SET_AVAILABLE_DOCUMENTS: (state, documentsAvailableToReview) => {
    state.documentsAvailableToReview = documentsAvailableToReview;
  },
  ADD_AVAILABLE_DOCUMENT: (state, availableDocument) => {
    const docAlreadyExists = state.documentsAvailableToReview.find(
      (document) => document.id === availableDocument.id
    );
    if (!docAlreadyExists) {
      state.documentsAvailableToReview.push(availableDocument);
    }
  },
  SET_CATEGORIES: (state, categories) => {
    state.categories = categories;
  },
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters,
};
