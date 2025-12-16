import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentsAvailableToReview: [], // filtered by user
  categories: null,
};

const getters = {
  /**
   * Get the category name for a given category ID
   */
  categoryName: (state) => (categoryId) => {
    if (categoryId && state.categories) {
      const category = state.categories.find(
        (tempCategory) => tempCategory.id == categoryId
      );
      if (category) {
        return category.name;
      }
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
      const category = state.categories.find(
        (tempCategory) => tempCategory.id == categoryId
      );
      if (category) {
        return category;
      }
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

      return dispatch(
        "project/fetchDocumentListWithParameters",
        parameters
      ).then((documents) => {
        for (let i = 0; i < documents.length; i++) {
          const found = state.documentsAvailableToReview.find(
            (doc) => doc.id === documents[i].id
          );

          if (found) {
            // If the document is already in the available docs array
            // we go to the next item
            continue;
          } else if (
            rootGetters["document/isDocumentReadyToBeReviewed"](documents)
          ) {
            // add available doc to the end of the array
            commit("ADD_AVAILABLE_DOCUMENT", documents);
          } else if (
            rootGetters["document/documentHadErrorDuringExtraction"](documents)
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
          documents.length !== state.documentsAvailableToReview.length &&
          state.documentsAvailableToReview.length + errors !== documents.length
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
      documents.length === 0 ||
      documents.length !== state.documentsAvailableToReview.length
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
      .then(async (results) => {
        if (results) {
          commit("SET_CATEGORIES", results);
        }
      })
      .catch(() => {
        // Error is silently ignored
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
