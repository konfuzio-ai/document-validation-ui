import myImports from "../api";
const HTTP = myImports.HTTP;

const state = {
  projectId: null,
  currentUser: null,
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
        commit("SET_CURRENT_USER", response.data.username);
      })
      .catch((error) => {
        console.log(error);
      });
  },

  setCurrentUser: ({ commit }, currentUser) => {
    commit("SET_CURRENT_USER", currentUser);
  },
};

const mutations = {
  SET_PROJECT_ID: (state, projectId) => {
    state.projectId = projectId;
  },
  SET_CURRENT_USER: (state, currentUser) => {
    state.currentUser = currentUser;
  },
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters,
};
