import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  createAvailableListOfDocuments: false,
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

  categoryConfidence: () => (confidence) => {
    if (!confidence) {
      if (confidence === 0) return confidence.toFixed(2);

      return;
    }

    return (confidence * 100).toFixed(2);
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

  projectHasSingleCategory: (state) => {
    return state.categories && state.categories.length === 1;
  },
};

const actions = {
  setDocumentsAvailableToReview: ({ commit }, documentsAvailableToReview) => {
    commit("SET_AVAILABLE_DOCUMENTS", documentsAvailableToReview);
  },
  setCategories: ({ commit }, categories) => {
    commit("SET_CATEGORIES", categories);
  },

  createAvailableDocumentsList: (
    { commit, state, dispatch, rootState, rootGetters },
    { categoryId, user, poll }
  ) => {
    if (!state.createAvailableListOfDocuments) return;

    const parameters = `category=${categoryId}`;

    const sleep = (duration) =>
      new Promise((resolve) => setTimeout(resolve, duration));

    // Poll document data until the status_data is 2
    // and labeling is available (done)
    let count = 0;
    const pollUntilLabelingAvailable = (duration) => {
      let errors = 0;
      count += 1;

      return dispatch("project/fetchDocumentList", parameters).then(() => {
        for (let i = 0; i < rootState.project.documentsInProject.length; i++) {
          const found = state.documentsAvailableToReview.find(
            (doc) => doc.id === rootState.project.documentsInProject[i].id
          );

          if (found) {
            // If the document is already in the available docs array
            // we go to the next item
            continue;
          } else if (
            rootGetters["document/isDocumentReadyToBeReviewed"](
              rootState.project.documentsInProject[i]
            )
          ) {
            // add available doc to the end of the array
            commit(
              "ADD_AVAILABLE_DOCUMENT",
              rootState.project.documentsInProject[i]
            );
          } else if (
            rootGetters["document/documentHadErrorDuringExtraction"](
              rootState.project.documentsInProject[i]
            )
          ) {
            dispatch("document/setDocumentError", null, { root: true });
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
          rootState.project.documentsInProject.length !==
            state.documentsAvailableToReview.length &&
          state.documentsAvailableToReview.length + errors !==
            rootState.project.documentsInProject.length
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
      rootState.project.documentsInProject.length === 0 ||
      rootState.project.documentsInProject.length !==
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
    return myImports
      .makeGetPaginatedRequest(`categories/?project=${projectId}`, true)
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
