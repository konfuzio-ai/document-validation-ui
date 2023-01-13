import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  editMode: false,
  splitOverview: false,
  isMultipleSelection: false,
  documentPagesListForEditMode: [], // TODO: change name
  selectedPages: [],
  updatedDocument: [],
};

const actions = {
  enableEditMode: ({ commit }) => {
    commit("SET_EDIT_MODE", true);
  },

  disableEditMode: ({ commit }) => {
    commit("SET_EDIT_MODE", false);
    commit("SET_SPLIT_OVERVIEW", false);
  },

  setSplitOverview: ({ commit }, overview) => {
    commit("SET_SPLIT_OVERVIEW", overview);
  },

  setDocumentPagesListForEditMode: ({ commit }, pages) => {
    commit("SET_DOCUMENT_PAGES_FOR_EDIT_MODE", pages);
  },

  setUpdatedDocument: ({ commit }, updatedDocument) => {
    commit("SET_UPDATED_DOCUMENT", updatedDocument);
  },

  setSelectedPages: ({ state, commit }, selectedPage) => {
    if (!selectedPage) {
      commit("SET_SELECTED_PAGES", []);
      return;
    }

    const found = state.selectedPages.find(
      (page) => page.id === selectedPage.id
    );

    if (found) {
      const filtered = state.selectedPages.filter(
        (page) => page.id !== selectedPage.id
      );
      commit("SET_SELECTED_PAGES", filtered);
    } else if (state.isMultipleSelection) {
      commit("ADD_SELECTED_PAGE", selectedPage);
    } else {
      commit("SET_SELECTED_PAGES", []);
      commit("ADD_SELECTED_PAGE", selectedPage);
    }
  },

  rotatePage: ({ state, commit }, { page, direction }) => {
    if (state.documentPagesListForEditMode.find((p) => p.id === page[0].id)) {
      const documentPagesListForEditMode =
        state.documentPagesListForEditMode.map((p) => {
          let rotatedAngle;
          if (direction === "left") {
            rotatedAngle = p.angle - 90;
            if (p.id === page[0].id) {
              if (rotatedAngle === -270) {
                rotatedAngle = 90;
              }
              return {
                ...p,
                angle: rotatedAngle,
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
                angle: rotatedAngle,
              };
            }
            return p;
          }
        });

      commit("SET_DOCUMENT_PAGES_FOR_EDIT_MODE", documentPagesListForEditMode);
    } else {
      if (direction === "left") {
        state.documentPagesListForEditMode.push({
          id: page.id,
          page_number: page.number,
          angle: -90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at,
        });
      }

      if (direction === "right") {
        state.documentPagesListForEditMode.push({
          id: page.id,
          page_number: page.number,
          angle: 90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at,
        });
      }
    }
  },

  updateRotationToTheLeft: ({ state, commit }) => {
    // updated the angles that will be sent to the backend
    const array = state.documentPagesListForEditMode.map((p) => {
      let rotatedAngle = p.angle - 90;
      if (rotatedAngle === -270) {
        rotatedAngle = 90;
      }
      return {
        ...p,
        angle: rotatedAngle,
      };
    });

    commit("SET_DOCUMENT_PAGES_FOR_EDIT_MODE", array);
  },

  updateRotationToTheRight: ({ state, commit }) => {
    // updated the angles that will be sent to the backend
    const array = state.documentPagesListForEditMode.map((p) => {
      let rotatedAngle = p.angle + 90;
      if (rotatedAngle === 270) {
        rotatedAngle = -90;
      }
      return {
        ...p,
        angle: rotatedAngle,
      };
    });

    commit("SET_DOCUMENT_PAGES_FOR_EDIT_MODE", array);
  },

  editDocument: ({ rootState, dispatch }, editedDocument) => {
    dispatch("document/startRecalculatingAnnotations", null, {
      root: true,
    });
    return new Promise((resolve) => {
      HTTP.post(
        `/documents/${rootState.document.documentId}/postprocess/`,
        editedDocument
      )
        .then(async (response) => {
          if (response && response.status === 200) {
            const newDocument = response.data[0];
            const newId = newDocument.id;

            await dispatch("document/setDocId", newId, {
              root: true,
            });
            dispatch("document/pollDocumentEndpoint", null, {
              root: true,
            });
            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          resolve(error.response);
          console.log(error);
        });
    });
  },
};

const mutations = {
  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },

  SET_SPLIT_OVERVIEW: (state, overview) => {
    state.splitOverview = overview;
  },

  SET_DOCUMENT_PAGES_FOR_EDIT_MODE: (state, pages) => {
    state.documentPagesListForEditMode = pages;
  },

  SET_UPDATED_DOCUMENT: (state, updatedDocument) => {
    state.updatedDocument = updatedDocument;
  },
  SET_SELECTED_PAGES: (state, selectedPages) => {
    state.selectedPages = selectedPages;
  },
  ADD_SELECTED_PAGE: (state, selectedPage) => {
    state.selectedPages.push(selectedPage);
  },
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
};
