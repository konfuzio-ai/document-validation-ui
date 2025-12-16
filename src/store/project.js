import myImports from "../api";
const HTTP = myImports.HTTP;

const state = {
  projectId: null,
  labelSets: null,
  currentUser: null,
  documentsListPath: null,
  showAnnotationTranslations: false,
};

const actions = {
  setProjectId: ({ commit }, projectId) => {
    commit("SET_PROJECT_ID", projectId);
  },
  // Get label details
  fetchLabelSetDetails: ({ commit, state }, labelSetId) => {
    return new Promise((resolve, reject) => {
      HTTP.get(`label-sets/${labelSetId}/`)
        .then((response) => {
          return resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // Get label sets from the project
  fetchLabelSets: ({ commit, state }) => {
    return myImports
      .makeGetPaginatedRequest(`label-sets/?project=${state.projectId}`, true)
      .then((results) => {
        commit("SET_LABEL_SETS", results);
      })
      .catch(() => {
        // Error is silently ignored
      });
  },

  fetchCurrentUser: ({ commit }) => {
    return HTTP.get(`/auth/me/`)
      .then((response) => {
        commit("SET_CURRENT_USER", response.data);
      })
      .catch(() => {
        // Error is silently ignored
      });
  },

  setCurrentUser: ({ commit }, currentUser) => {
    commit("SET_CURRENT_USER", currentUser);
  },

  setDocumentsListPath: ({ commit }, path) => {
    commit("SET_DOCUMENTS_LIST_PATH", path);
  },

  setShowAnnotationTranslations: ({ commit }, show) => {
    commit("SET_SHOW_ANNOTATION_TRANSLATIONS", show);
  },

  fetchDocumentListWithParameters: ({ commit, state }, parameters) => {
    return new Promise((resolve, reject) => {
      myImports
        .makeGetPaginatedRequest(
          `documents/?project=${state.projectId}&${parameters}`,
          true
        )
        .then((results) => {
          resolve(results);
        })
        .catch(() => {
          reject();
        });
    });
  },
  fetchDocumentListForNavigation: ({ commit, state }) => {
    return new Promise((resolve, reject) => {
      myImports
        .makeGetPaginatedRequest(
          `documents/?project=${state.projectId}&is_reviewed=false&fields=id`,
          true
        )
        .then((results) => {
          resolve(results);
        })
        .catch(() => {
          reject();
        });
    });
  },
};

const mutations = {
  SET_PROJECT_ID: (state, projectId) => {
    state.projectId = projectId;
  },
  SET_CURRENT_USER: (state, currentUser) => {
    state.currentUser = currentUser;
  },
  SET_LABEL_SETS: (state, labelSets) => {
    state.labelSets = labelSets;
  },
  SET_DOCUMENTS_LIST_PATH: (state, path) => {
    state.documentsListPath = path;
  },
  SET_SHOW_ANNOTATION_TRANSLATIONS: (state, show) => {
    state.showAnnotationTranslations = show;
  },
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
};
