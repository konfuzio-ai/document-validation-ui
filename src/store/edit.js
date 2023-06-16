import myImports from "../api";
import {
  getURLQueryParam,
  navigateToNewDocumentURL,
  getURLPath,
} from "../utils/utils";

const HTTP = myImports.HTTP;

const state = {
  editMode: false,
  splitOverview: false,
  isMultipleSelection: false,
  pagesForPostprocess: [],
  selectedPages: [],
  updatedDocument: [],
  showEditConfirmationModal: false,
  documentBeingSplit: false,
};

const getters = {
  isPageSelected: (state) => (id) => {
    return state.selectedPages.find((page) => page.id === id);
  },
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

  setPagesForPostprocess: ({ commit }, pages) => {
    commit("SET_PAGES_FOR_POSTPROCESS", pages);
  },

  setUpdatedDocument: ({ commit }, updatedDocument) => {
    commit("SET_UPDATED_DOCUMENT", updatedDocument);
  },

  setDocumentBeingSplit: ({ commit }, value) => {
    commit("SET_DOCUMENT_BEING_SPLIT", value);
  },

  selectPage: ({ state, commit }, page) => {
    if (state.isMultipleSelection) {
      commit("ADD_SELECTED_PAGE", page);
    } else {
      commit("SET_SELECTED_PAGES", []);
      commit("ADD_SELECTED_PAGE", page);
    }
  },

  unselectPage: ({ state, commit }, selectedPage) => {
    const found = state.selectedPages.find(
      (page) => page.id === selectedPage.id
    );
    if (found) {
      const filtered = state.selectedPages.filter(
        (page) => page.id !== selectedPage.id
      );
      commit("SET_SELECTED_PAGES", filtered);
    }
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
    if (state.pagesForPostprocess.find((p) => p.id === page[0].id)) {
      const pagesForPostprocess = state.pagesForPostprocess.map((p) => {
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

      commit("SET_PAGES_FOR_POSTPROCESS", pagesForPostprocess);
    } else {
      if (direction === "left") {
        state.pagesForPostprocess.push({
          id: page.id,
          number: page.number,
          angle: -90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at,
        });
      }

      if (direction === "right") {
        state.pagesForPostprocess.push({
          id: page.id,
          number: page.number,
          angle: 90,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at,
        });
      }
    }
  },

  updateRotationToTheLeft: ({ state, commit }) => {
    // updated the angles that will be sent to the backend
    const array = state.pagesForPostprocess.map((p) => {
      let rotatedAngle = p.angle - 90;
      if (rotatedAngle === -270) {
        rotatedAngle = 90;
      }
      return {
        ...p,
        angle: rotatedAngle,
      };
    });

    commit("SET_PAGES_FOR_POSTPROCESS", array);
  },

  updateRotationToTheRight: ({ state, commit }) => {
    // updated the angles that will be sent to the backend
    const array = state.pagesForPostprocess.map((p) => {
      let rotatedAngle = p.angle + 90;
      if (rotatedAngle === 270) {
        rotatedAngle = -90;
      }
      return {
        ...p,
        angle: rotatedAngle,
      };
    });

    commit("SET_PAGES_FOR_POSTPROCESS", array);
  },

  editDocument: ({ rootState, commit, dispatch }, editedDocument) => {
    dispatch("document/startRecalculatingAnnotations", null, {
      root: true,
    });

    commit("SET_DOCUMENT_BEING_SPLIT", true);

    const oldId = rootState.document.documentId;

    return new Promise((resolve, reject) => {
      HTTP.post(
        `/documents/${rootState.document.documentId}/postprocess/`,
        editedDocument
      )
        .then(async (response) => {
          if (response && response.status === 200) {
            const newId = response.data[0].id;
            dispatch("document/setSplittingSuggestions", null, { root: true });

            commit("SET_DOCUMENT_BEING_SPLIT", false);

            if (newId !== oldId) {
              if (getURLQueryParam("document") || getURLPath("docs")) {
                navigateToNewDocumentURL(oldId, newId);
              } else {
                await dispatch("document/setDocId", newId, {
                  root: true,
                });

                dispatch("document/pollDocumentEndpoint", null, {
                  root: true,
                });
              }
            }

            resolve(null);
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          reject(error.response);
          console.log(error);
        });
    });
  },

  setShowEditConfirmationModal: ({ commit }, value) => {
    commit("SET_SHOW_EDIT_CONFIRMATION_MODAL", value);
  },
};

const mutations = {
  SET_EDIT_MODE: (state, option) => {
    state.editMode = option;
  },

  SET_SPLIT_OVERVIEW: (state, overview) => {
    state.splitOverview = overview;
  },

  SET_PAGES_FOR_POSTPROCESS: (state, pages) => {
    state.pagesForPostprocess = pages;
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
  SET_SHOW_EDIT_CONFIRMATION_MODAL: (state, value) => {
    state.showEditConfirmationModal = value;
  },
  SET_DOCUMENT_BEING_SPLIT: (state, value) => {
    state.documentBeingSplit = value;
  },
};

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters,
};
