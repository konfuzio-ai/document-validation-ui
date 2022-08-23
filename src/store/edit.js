import { root } from "postcss";
import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentId: process.env.VUE_APP_DOCUMENT_ID,
  editMode: null,
  splitOverview: null,
  selectedPages: [],
  rotations: [],
  rotationsForBackend: [],
  splitPages: []
};

const getters = {};

const actions = {
  setDocId: ({ commit }, id) => {
    commit("SET_DOC_ID", id);
  },

  setEditMode: ({ commit }, value) => {
    commit("SET_EDIT_MODE", value);
  },

  disableEditMode: ({ commit }) => {
    commit("SET_EDIT_MODE", null);
    commit("SET_SPLIT_OVERVIEW", null);
  },

  setSplitOverview: ({ commit }, overview) => {
    commit("SET_SPLIT_OVERVIEW", overview);
  },

  setRotations: ({ commit }, rotations) => {
    commit("SET_ROTATIONS", rotations);
  },

  setRotationsForBackend: ({ commit }, rotations) => {
    commit("SET_ROTATIONS_FOR_BACKEND", rotations);
  },

  setSplitPages: ({ commit }, splitPages) => {
    commit("SET_SPLIT_PAGES", splitPages);
  },

  setSelectedPages: ({ state }, selectedPage) => {
    const found = state.selectedPages.find(page => page === selectedPage);

    if (found) {
      state.selectedPages.filter(page => page !== selectedPage);
    } else {
      state.selectedPages.push(selectedPage);
    }
  },

  updateSinglePageRotation: ({ state, commit }, { pageId, pageNumber }) => {
    // If the item already exists in the array and matches the clicked one,
    // update it to the new rotation
    if (state.rotations.find(rotation => rotation.id === pageId)) {
      const rotations = state.rotations.map(rotation => {
        if (rotation.id === pageId) {
          return {
            ...rotation,
            angle: rotation.angle - 90
          };
        }
        return rotation;
      });

      commit("SET_ROTATIONS", rotations);

      // Rotations to send to the backend
      // due to only allowing -90 to 180 angles
      if (state.rotationsForBackend.find(rotation => rotation.id === pageId)) {
        const rotationsForBackend = state.rotationsForBackend.map(rotation => {
          let rotatedAngle = rotation.angle - 90;
          if (rotation.id === pageId) {
            if (rotatedAngle === -270) {
              rotatedAngle = 90;
            }
            return {
              ...rotation,
              angle: rotatedAngle
            };
          }
          return rotation;
        });

        commit("SET_ROTATIONS_FOR_BACKEND", rotationsForBackend);
      } else {
        state.rotationsForBackend.push({
          id: pageId,
          page_number: pageNumber,
          angle: -90
        });
      }
    } else {
      state.rotations.push({
        id: pageId,
        page_number: pageNumber,
        angle: -90
      });
    }
  },

  updateRotationToTheLeft: ({ state, commit }) => {
    const rotations = state.rotations.map(rotation => {
      return { ...rotation, angle: rotation.angle - 90 };
    });

    commit("SET_ROTATIONS", rotations);

    const rotationsForBackend = state.rotationsForBackend.map(rotation => {
      let rotatedAngle = rotation.angle - 90;
      if (rotatedAngle === -270) {
        rotatedAngle = 90;
      }
      return { ...rotation, angle: rotatedAngle };
    });

    commit("SET_ROTATIONS_FOR_BACKEND", rotationsForBackend);
  },

  updateRotationToTheRight: ({ state, commit }) => {
    const rotations = state.rotations.map(rotation => {
      return { ...rotation, angle: rotation.angle + 90 };
    });

    commit("SET_ROTATIONS", rotations);

    const rotationsForBackend = state.rotationsForBackend.map(rotation => {
      let rotatedAngle = rotation.angle + 90;
      if (rotatedAngle === 270) {
        rotatedAngle = -90;
      }
      return { ...rotation, angle: rotatedAngle };
    });

    commit("SET_ROTATIONS_FOR_BACKEND", rotationsForBackend);
  },

  updatePageRotation: ({ state }, changedRotations) => {
    return new Promise(resolve => {
      HTTP.post(`/documents/${state.documentId}/rotate/`, changedRotations)
        .then(response => {
          if (response.status === 204) {
            resolve(true);
          }
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  editDocument: ({ state }, editedDocument) => {
    console.log(editedDocument);
    // return new Promise(resolve => {
    //   HTTP.post(`/documents/${state.documentId}/process/`, editedDocument)
    //     .then(response => {
    //       console.log(response);
    //       // if (response.status === 204) {
    //       //   resolve(true);
    //       // }
    //     })
    //     .catch(error => {
    //       resolve(false);
    //       console.log(error);
    //     });
    // });
  }
};

const mutations = {
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },

  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },

  SET_SPLIT_OVERVIEW: (state, overview) => {
    state.splitOverview = overview;
  },

  SET_ROTATIONS: (state, rotations) => {
    state.rotations = rotations;
  },

  SET_ROTATIONS_FOR_BACKEND: (state, rotations) => {
    state.rotationsForBackend = rotations;
  },

  SET_SPLIT_PAGES: (state, splitPages) => {
    state.splitPages = splitPages;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
