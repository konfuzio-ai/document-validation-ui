import { root } from "postcss";
import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentId: process.env.VUE_APP_DOCUMENT_ID,
  editMode: false,
  splitOverview: false,
  pagesArray: [],
  selectedPages: [],
  pagesForTheBackend: [],
  splitPages: []
};

const actions = {
  setDocId: ({ commit }, id) => {
    commit("SET_DOC_ID", id);
  },

  setEditMode: ({ commit }, value) => {
    commit("SET_EDIT_MODE", value);
  },

  disableEditMode: ({ commit }) => {
    commit("SET_EDIT_MODE", false);
    commit("SET_SPLIT_OVERVIEW", false);
  },

  setSplitOverview: ({ commit }, overview) => {
    commit("SET_SPLIT_OVERVIEW", overview);
  },

  setPagesArray: ({ commit }, pagesArray) => {
    commit("SET_PAGES_ARRAY", pagesArray);
  },

  setPagesForTheBackend: ({ commit }, pages) => {
    commit("SET_PAGES_FOR_THE_BACKEND", pages);
  },

  setSplitPages: ({ commit }, splitPages) => {
    commit("SET_SPLIT_PAGES", splitPages);
  },

  setSelectedPages: ({ state, commit }, selectedPage) => {
    const found = state.selectedPages.find(page => page.id === selectedPage.id);

    if (found) {
      const filtered = state.selectedPages.filter(
        page => page.id !== selectedPage.id
      );
      commit("SET_SELECTED_PAGES", filtered);
    } else {
      state.selectedPages.pop();
      state.selectedPages.push(selectedPage);
    }
  },

  rotatePage: ({ state, commit }, { page, direction }) => {
    // If the item already exists in the array and matches the clicked one,
    // update it to the new rotation
    if (state.pagesArray.find(p => p.id === page[0].id)) {
      const array = state.pagesArray.map(p => {
        if (p.id === page[0].id) {
          if (direction === "left")
            return {
              ...p,
              angle: p.angle - 90
            };
          if (direction === "right") {
            return {
              ...p,
              angle: p.angle + 90
            };
          }
        }
        return p;
      });

      commit("SET_PAGES_ARRAY", array);

      // Rotations to send to the backend
      // due to only allowing -90 to 180 angles
      if (state.pagesForTheBackend.find(p => p.id === page[0].id)) {
        const pagesForTheBackend = state.pagesForTheBackend.map(p => {
          let rotatedAngle = p.angle - 90;
          if (p.id === page[0].id) {
            if (rotatedAngle === -270) {
              rotatedAngle = 90;
            }
            return {
              ...p,
              angle: rotatedAngle
            };
          }
          return p;
        });

        commit("SET_PAGES_FOR_THE_BACKEND", pagesForTheBackend);
      } else {
        state.pagesForTheBackend.push({
          id: page.id,
          page_number: page.number,
          angle: -90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at
        });
      }
    } else {
      state.pagesArray.push({
        id: page.id,
        page_number: page.number,
        angle: -90,
        thumbnail_url: page.thumbnail_url,
        updated_at: page.updated_at
      });
    }
  },

  updateRotationToTheLeft: ({ state, commit }) => {
    const pages = state.pagesArray.map(p => {
      return { ...p, angle: p.angle - 90 };
    });

    commit("SET_PAGES_ARRAY", pages);

    const pagesForTheBackend = state.pagesForTheBackend.map(p => {
      let rotatedAngle = p.angle - 90;
      if (rotatedAngle === -270) {
        rotatedAngle = 90;
      }
      return { ...p, angle: rotatedAngle };
    });

    commit("SET_PAGES_FOR_THE_BACKEND", pagesForTheBackend);
  },

  updateRotationToTheRight: ({ state, commit }) => {
    const pages = state.pagesArray.map(p => {
      return { ...p, angle: p.angle + 90 };
    });

    commit("SET_PAGES_ARRAY", pages);

    const pagesForTheBackend = state.pagesForTheBackend.map(p => {
      let rotatedAngle = p.angle + 90;
      if (rotatedAngle === 270) {
        rotatedAngle = -90;
      }
      return { ...p, angle: rotatedAngle };
    });

    commit("SET_PAGES_FOR_THE_BACKEND", pagesForTheBackend);
  },

  // TODO: unify this function with editDocument
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
    return new Promise(resolve => {
      HTTP.post(`/documents/${state.documentId}/process/`, editedDocument)
        .then(response => {
          console.log(response);
          if (response.status === 204) {
            resolve(true);
          }
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  }
};

const mutations = {
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },

  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },

  SET_PAGES_ARRAY: (state, pagesArray) => {
    state.pagesArray = pagesArray;
  },

  SET_SPLIT_OVERVIEW: (state, overview) => {
    state.splitOverview = overview;
  },

  SET_PAGES_FOR_THE_BACKEND: (state, pages) => {
    state.pagesForTheBackend = pages;
  },

  SET_SPLIT_PAGES: (state, splitPages) => {
    state.splitPages = splitPages;
  },

  SET_SELECTED_PAGES: (state, selectedPages) => {
    state.selectedPages = selectedPages;
  }
};

export default {
  namespaced: true,
  state,
  actions,
  mutations
};
