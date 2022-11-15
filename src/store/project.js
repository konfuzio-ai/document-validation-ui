const state = {
  projectId: null
};


const actions = {
  setProjectId: ({
    commit
  }, projectId) => {
    commit("SET_PROJECT_ID", projectId);
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