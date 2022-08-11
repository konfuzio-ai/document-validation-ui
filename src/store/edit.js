import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentId: process.env.VUE_APP_DOCUMENT_ID,
  editMode: null,
  editOptions: {
    reorder: "reorder",
    rotate: "rotate",
    split: "split"
  },
  rotations: [],
  rotationsForBackend: [],
  activeSplittingLines: [],
  pageData: [],
  splitPages: []
};

const getters = {};

const actions = {
  setDocId: ({ commit }, id) => {
    commit("SET_DOC_ID", id);
  },

  setEditMode: ({ commit }, option) => {
    commit("SET_EDIT_MODE", option);
  },

  disableEditMode: ({ commit }) => {
    commit("SET_EDIT_MODE", null);
  },

  setRotations: ({ commit }, rotations) => {
    commit("SET_ROTATIONS", rotations);
  },

  setRotationsForBackend: ({ commit }, rotations) => {
    commit("SET_ROTATIONS_FOR_BACKEND", rotations);
  },

  setActiveSplittingLines: ({ commit }, splitLines) => {
    console.log("split", splitLines);
    commit("SET_ACTIVE_SPLITTING_LINES", splitLines);
  },

  setImages: ({ commit }, images) => {
    commit("SET_IMAGES", images);
  },

  setSplitPages: ({ commit }, splitPages) => {
    commit("SET_SPLIT_PAGES", splitPages);
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
    console.log(changedRotations);
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

  updateActiveSplittingLines: ({ state, commit }, page) => {
    console.log(page);
    const found = state.activeSplittingLines.find(item => item === page.number);

    if (found) {
      commit(
        "SET_ACTIVE_SPLITTING_LINES",
        state.activeSplittingLines.splice(page.number - 1, 1, 0)
      );
    } else {
      commit(
        "SET_ACTIVE_SPLITTING_LINES",
        state.activeSplittingLines.splice(page.number - 1, 1, page.number)
      );
    }
  }
};

const mutations = {
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },

  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },

  SET_ROTATIONS: (state, rotations) => {
    state.rotations = rotations;
  },

  SET_ROTATIONS_FOR_BACKEND: (state, rotations) => {
    state.rotationsForBackend = rotations;
  },

  SET_ACTIVE_SPLITTING_LINES: (state, splitLines) => {
    state.activeSplittingLines = splitLines;
  },

  SET_IMAGES: (state, images) => {
    state.imagesArray = images;
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
