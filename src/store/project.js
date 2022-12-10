import myImports from "../api";
const HTTP = myImports.HTTP;

const state = {
  projectId: null
};

const actions = {
  setProjectId: ({
    commit
  }, projectId) => {
    commit("SET_PROJECT_ID", projectId);
  },
  // Get label details
  fetchLabelSetDetails: ({
    commit,
    state
  }, labelSetId) => {
    return new Promise((resolve, reject) => {
      HTTP.get(`label-sets/${labelSetId}/`)
        .then(response => {
          return resolve(response.data);
        })
        .catch(error => {
          reject(error);
          console.log(error);
        });
    });
  },

  // Get label sets from the project
  fetchLabelSets: ({
    state
  }) => {
    return new Promise((resolve, reject) => {
      HTTP.get(`label-sets/?project=${state.projectId}`)
        .then(response => {
          return resolve(response.data.results);
        })
        .catch(error => {
          reject(error);
          console.log(error);
        });
    });
  },
};

const mutations = {
  SET_PROJECT_ID: (state, projectId) => {
    state.projectId = projectId;
  },
};

export default {
  namespaced: true,
  state,
  actions,
  mutations
};