import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  editMode: false,
  splitOverview: false,
  pagesFrontend: [],
  pagesArray: [],
  selectedPages: [],
  updatedDocument: []
};

const actions = {
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

  setPagesFrontend: ({ commit }, pagesFrontend) => {
    commit("SET_PAGES_FRONTEND", pagesFrontend);
  },

  setPagesArray: ({ commit }, pages) => {
    commit("SET_PAGES_ARRAY", pages);
  },

  setUpdatedDocument: ({ commit }, updatedDocument) => {
    commit("SET_UPDATED_DOCUMENT", updatedDocument);
  },

  setSelectedPages: ({ state, commit }, selectedPage) => {
    if (!selectedPage) return;

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
    if (state.pagesFrontend.find(p => p.id === page[0].id)) {
      const array = state.pagesFrontend.map(p => {
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

      commit("SET_PAGES_FRONTEND", array);

      // Rotations to send to the backend
      // due to only allowing -90 to 180 angles
      if (state.pagesArray.find(p => p.id === page[0].id)) {
        const pagesArray = state.pagesArray.map(p => {
          let rotatedAngle;
          if (direction === "left") {
            rotatedAngle = p.angle - 90;
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
          }
          if (direction === "right") {
            rotatedAngle = p.angle + 90;
            if (p.id === page[0].id) {
              if (rotatedAngle === 270) {
                rotatedAngle = -90;
              }
              return {
                ...p,
                angle: rotatedAngle
              };
            }
            return p;
          }
        });

        commit("SET_PAGES_ARRAY", pagesArray);
      } else {
        if (direction === "left") {
          state.pagesArray.push({
            id: page.id,
            page_number: page.number,
            angle: -90,
            thumbnail_url: page.thumbnail_url,
            updated_at: page.updated_at
          });
        }

        if (direction === "right") {
          state.pagesArray.push({
            id: page.id,
            page_number: page.number,
            angle: 90,
            thumbnail_url: page.thumbnail_url,
            updated_at: page.updated_at
          });
        }
      }
    } else {
      if (direction === "left") {
        state.pagesFrontend.push({
          id: page.id,
          page_number: page.number,
          angle: -90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at
        });
      }

      if (direction === "right") {
        state.pagesFrontend.push({
          id: page.id,
          page_number: page.number,
          angle: 90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at
        });
      }
    }
  },

  updateRotationToTheLeft: ({ state, commit }) => {
    // update the angles to rotate pages in the frontend
    const pages = state.pagesFrontend.map(p => {
      return { ...p, angle: p.angle - 90 };
    });

    commit("SET_PAGES_FRONTEND", pages);

    // updated the angles that will be sent to the backend
    const array = state.pagesArray.map(p => {
      let rotatedAngle = p.angle - 90;
      if (rotatedAngle === -270) {
        rotatedAngle = 90;
      }
      return { ...p, angle: rotatedAngle };
    });

    commit("SET_PAGES_ARRAY", array);
  },

  updateRotationToTheRight: ({ state, commit }) => {
    // update the angles to rotate pages in the frontend
    const pages = state.pagesFrontend.map(p => {
      return { ...p, angle: p.angle + 90 };
    });

    commit("SET_PAGES_FRONTEND", pages);

    // updated the angles that will be sent to the backend
    const array = state.pagesArray.map(p => {
      let rotatedAngle = p.angle + 90;
      if (rotatedAngle === 270) {
        rotatedAngle = -90;
      }
      return { ...p, angle: rotatedAngle };
    });

    commit("SET_PAGES_ARRAY", array);
  },

  editDocument: ({ rootState, dispatch }, editedDocument) => {
    return new Promise(resolve => {
      HTTP.post(
        `/documents/${rootState.document.documentId}/postprocess/`,
        editedDocument
      )
        .then(async response => {
          if (response.status === 200) {
            const newDocument = response.data[0];
            const newId = newDocument.id;

            if (newId !== rootState.document.documentId) {
              await dispatch("document/setDocId", newId, {
                root: true
              });
            }
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
  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },

  SET_PAGES_FRONTEND: (state, pagesFrontend) => {
    state.pagesFrontend = pagesFrontend;
  },

  SET_SPLIT_OVERVIEW: (state, overview) => {
    state.splitOverview = overview;
  },

  SET_PAGES_ARRAY: (state, pages) => {
    state.pagesArray = pages;
  },

  SET_UPDATED_DOCUMENT: (state, updatedDocument) => {
    state.updatedDocument = updatedDocument;
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
