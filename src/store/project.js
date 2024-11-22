import myImports from "../api";
const HTTP = myImports.HTTP;

const state = {
  projectId: null,
  labelSets: null,
  currentUser: null,
  documentsListPath: null,
  documentsInProject: null,
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
          console.log(error);
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
      .catch((error) => {
        console.log(error);
      });
  },

  fetchCurrentUser: ({ commit }) => {
    return HTTP.get(`/auth/me/`)
      .then((response) => {
        commit("SET_CURRENT_USER", response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  },

  setCurrentUser: ({ commit }, currentUser) => {
    commit("SET_CURRENT_USER", currentUser);
  },

  setDocumentsListPath: ({ commit }, path) => {
    commit("SET_DOCUMENTS_LIST_PATH", path);
  },

  setDocumentsInProject: ({ commit }, documents) => {
    commit("SET_DOCUMENTS_IN_PROJECT", documents);
  },

  setShowAnnotationTranslations: ({ commit }, show) => {
    commit("SET_SHOW_ANNOTATION_TRANSLATIONS", show);
  },

  fetchDocumentList: ({ commit, state }, parameters) => {
    return myImports
      .makeGetPaginatedRequest(
        `documents/?project=${state.projectId}&${parameters}`,
        true
      )
      .then((results) => {
        if (results) {
          commit("SET_DOCUMENTS_IN_PROJECT", results);
        }
      })
      .catch((error) => {
        console.log(error, "Could not fetch document list from the backend");
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
  SET_DOCUMENTS_IN_PROJECT: (state, documents) => {
    state.documentsInProject = documents;
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
