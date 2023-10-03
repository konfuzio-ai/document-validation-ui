import myImports from "../api";
const HTTP = myImports.HTTP;

const state = {
  projectId: null,
  currentUser: null,
  documentsListPath: null,
  documentsInProject: null,
  translationsEnabled: false,
};

const getters = {
  /**
   * Gets label sets for an annotation set creation
   */
  labelSetsFilteredForAnnotationSetCreation:
    (state) => (labelsSet, annotationSets) => {
      let returnLabels = [];
      if (labelsSet) {
        returnLabels = labelsSet.filter((labelSet) => {
          // check if label set has multiple and if not, if there's already an annotation set created
          if (!labelSet.has_multiple_annotation_sets) {
            const existingAnnotationSet = annotationSets.find((annSet) => {
              return annSet.id === labelSet.id;
            });
            return existingAnnotationSet;
          } else {
            return true;
          }
        });
      }
      return returnLabels;
    },
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
  fetchLabelSets: ({ state }) => {
    return new Promise((resolve, reject) => {
      HTTP.get(`label-sets/?project=${state.projectId}`)
        .then((response) => {
          return resolve(response.data.results);
        })
        .catch((error) => {
          reject(error);
          console.log(error);
        });
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

  fetchDocumentList: ({ commit, state }, parameters) => {
    return HTTP.get(
      `documents/?project=${state.projectId}&assignee=${state.currentUser.username}&limit=100&${parameters}`
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

  fetchProjectDetails: ({commit}, projectId) => {
    return HTTP.get(
      `projects/${projectId}/`
    )
      .then((response) => {
        if (response.data.enable_translated_strings) {
          commit("SET_TRANSLATIONS_ENABLED", true);
        }
      })
      .catch((error) => {
        console.log(error, "Could not fetch project details from the backend");
      });
  }
};

const mutations = {
  SET_PROJECT_ID: (state, projectId) => {
    state.projectId = projectId;
  },
  SET_CURRENT_USER: (state, currentUser) => {
    state.currentUser = currentUser;
  },
  SET_DOCUMENTS_LIST_PATH: (state, path) => {
    state.documentsListPath = path;
  },
  SET_DOCUMENTS_IN_PROJECT: (state, documents) => {
    state.documentsInProject = documents;
  },
  SET_TRANSLATIONS_ENABLED: (state, value) => {
    state.translationsEnabled = value;
  }
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters,
};
