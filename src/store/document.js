import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  documentFocusedAnnotation: null,
  loading: true,
  pages: [],
  annotationSets: null,
  sidebarAnnotationSets: null, // this should be only used for displaying annotations in sidebar
  annotations: null,
  labels: [],
  documentId: null,
  sidebarAnnotationSelected: null,
  selectedDocument: null,
  documentIsReady: false,
  documentHasError: false,
  recalculatingAnnotations: false,
  editAnnotation: {
    id: null,
    index: 0,
    label: null,
    label_set: null
  },
  missingAnnotations: [],
  currentUser: null,
  publicView: process.env.VUE_APP_GUEST_USER_TOKEN == null,
  editingActive: false,
  showError: false,
  errorMessage: null,
  acceptAnnotation: false,
  showDocumentError: false,
  imageLoaded: false,
  rejectAnnotation: null,
  errorMessageWidth: null
};

const getters = {
  /**
   * Number of pages. If the pages array doesn't exist yet, return 0.
   */
  pageCount: state => {
    if (state.pages) {
      return state.pages.length;
    }
    return 0;
  },

  /**
   * Returns the current page
   */
  pageSelected: (state, _, rootState) => {
    if (state.pages) {
      return state.pages[rootState.display.currentPage - 1];
    }
    return null;
  },

  /**
   * Returns a page in the given index
   */
  pageAtIndex: state => index => {
    if (state.pages) {
      return state.pages[index];
    }
    return null;
  },

  /**
   * Checks if the document is categorized and ready to start the review
   */
  categorizationIsConfirmed: state => {
    if (state.selectedDocument) {
      if (state.selectedDocument.is_category_accepted || state.selectedDocument.is_reviewed) {
        return true;
      } else if (!state.selectedDocument.category) {
        return false;
      } else {
        // check if there's any annotation already approved
        const found = state.annotations.find((annotation) => {
          return annotation.revised;
        });
        return found != undefined;
      }
    }
    return false;
  },

  /**
   * Gets labels for an annotation set
   */
  labelsInAnnotationSet: state => annotationSet => {
    const labels = [];
    if (annotationSet && annotationSet.labels) {
      annotationSet.labels.map(label => {
        const newLabel = {
          ...label
        };
        labels.push(newLabel);
      });
    }
    return labels;
  },

  /* Checks if annotation is in deleted state */
  isAnnotationDeleted: state => annotation => {
    if (annotation) {
      return annotation.revised && !annotation.is_correct;
    }
    return false;
  },

  /* Checks if the label has annotations to show */
  labelHasAnnotations: (_, getters) => label => {
    const annotations = label.annotations.filter(annotation => {
      return !getters.isAnnotationDeleted(annotation);
    });
    return annotations.length > 0;
  },

  /**
   * Groups annotations in the same label that have the same content by accuracy
   */
  groupedAnnotations: (_, getters) => annotationsInLabel => {
    const annotations = [];
    let addedAnnotation;

    const pushAnnotation = (annotation, array) => {
      if (annotation && !getters.isAnnotationDeleted(annotation)) {
        // clone annotation so we don't mess with existing objects
        array.push({
          ...annotation
        });
      }
    };

    const createAnnotationGroup = annotation => {
      annotation.groupedAnnotations = [annotation];
    };

    const moveAnnotationGroup = (from, to) => {
      to.groupedAnnotations = from.groupedAnnotations;
      delete from.groupedAnnotations;
    };

    if (annotationsInLabel) {
      annotationsInLabel.map(annotation => {
        addedAnnotation = false;
        annotations.map(annotationToCompare => {
          // compare if the annotations have the same content
          if (annotation.offset_string === annotationToCompare.offset_string) {
            if (annotationToCompare.groupedAnnotations) {
              pushAnnotation(
                annotation,
                annotationToCompare.groupedAnnotations
              );
            } else {
              createAnnotationGroup(annotationToCompare);
              pushAnnotation(
                annotation,
                annotationToCompare.groupedAnnotations
              );
            }
            addedAnnotation = true;
          }
        });
        if (!addedAnnotation) {
          pushAnnotation(annotation, annotations);
        }
      });
    }

    // order annotation groups by confidence
    const orderedAnnotations = annotations.map(annotation => {
      if (annotation.groupedAnnotations) {
        // sort array
        annotation.groupedAnnotations.sort(
          (a, b) => b.confidence - a.confidence
        );
        // remove first element
        const firstAnnotation = annotation.groupedAnnotations.shift();
        if (annotation.id !== firstAnnotation.id) {
          moveAnnotationGroup(annotation, firstAnnotation);
        }
        return firstAnnotation;
      } else {
        return annotation;
      }
    });

    return orderedAnnotations;
  },

  /**
   * Checks if theres a group of annotation sets and add an index number to them
   */
  numberOfAnnotationSetGroup: state => annotationSet => {
    let found = false;
    let value = 0;
    let index = 0;
    if (state.annotationSets) {
      state.annotationSets.map(annotationSetTemp => {
        if (
          annotationSetTemp.id !== annotationSet.id &&
          annotationSetTemp.label_set.id === annotationSet.label_set.id &&
          annotationSetTemp.label_set.name === annotationSet.label_set.name
        ) {
          found = true;
          index++;
        } else if (
          annotationSetTemp.label_set.id === annotationSet.label_set.id
        ) {
          value = index;
        }
      });
      return found ? `${value + 1}` : "";
    }
  },

  /**
   * Checks if annotation is being edited
   */
  isAnnotationInEditMode: state =>
    (annotationId, index = null) => {
      if (state.editAnnotation && annotationId) {
        if (index != null) {
          return (
            state.editAnnotation.id === annotationId &&
            state.editAnnotation.index === index
          );
        }
        return state.editAnnotation.id === annotationId;
      }
    }
};

const actions = {
  startLoading: ({
    commit
  }) => {
    commit("SET_LOADING", true);
  },
  endLoading: ({
    commit
  }) => {
    commit("SET_LOADING", false);
  },
  setDocId: ({
    commit
  }, id) => {
    commit("SET_PAGES", []);
    commit("SET_DOC_ID", id);
  },
  setSidebarAnnotationSelected: ({
    commit
  }, annotation) => {
    commit("SET_ANNOTATION_SELECTED", annotation);
  },
  setAnnotationSets: ({
    commit
  }, annotationSets) => {
    commit("SET_ANNOTATION_SETS", annotationSets);
  },
  setSidebarAnnotationSets: ({
    commit
  }, annotationSets) => {
    commit("SET_SIDEBAR_ANNOTATION_SETS", annotationSets);
  },
  setEditAnnotation: ({
    commit
  }, values) => {
    commit("SET_EDIT_ANNOTATION", values);
  },
  resetEditAnnotation: ({
    commit
  }) => {
    commit("RESET_EDIT_ANNOTATION");
  },
  setAnnotations: ({
    commit
  }, annotations) => {
    commit("SET_ANNOTATIONS", annotations);
  },
  setLabels: ({
    commit
  }, labels) => {
    commit("SET_LABELS", labels);
  },
  setPages: ({
    commit
  }, pages) => {
    commit("SET_PAGES", pages);
  },
  setSelectedDocument: ({
    commit
  }, document) => {
    commit("SET_SELECTED_DOCUMENT", document);
  },
  startRecalculatingAnnotations: ({
    commit
  }) => {
    commit("SET_RECALCULATING_ANNOTATIONS", true);
  },
  endRecalculatingAnnotations: ({
    commit
  }) => {
    commit("SET_RECALCULATING_ANNOTATIONS", false);
  },
  setMissingAnnotations: ({
    commit
  }, missingAnnotations) => {
    commit("SET_MISSING_ANNOTATIONS", missingAnnotations);
  },
  setCurrentUser: ({
    commit
  }, currentUser) => {
    commit("SET_CURRENT_USER", currentUser);
  },
  setEditingActive: ({
    commit
  }, value) => {
    commit("SET_EDITING_ACTIVE", value);
  },
  setErrorMessage: ({
    commit
  }, message) => {
    if (message) {
      commit("SET_SHOW_ERROR", true);
    } else {
      commit("SET_SHOW_ERROR", false);
    }

    commit("SET_ERROR_MESSAGE", message);
  },
  setAcceptAnnotation: ({
    commit
  }, value) => {
    commit("SET_ACCEPT_ANNOTATION", value);
  },
  setDocumentError: ({
    commit
  }, value) => {
    commit("SET_DOCUMENT_ERROR", value);
  },
  setImageLoaded: ({
    commit
  }, value) => {
    commit("SET_IMAGE_LOADED", value);
  },
  setRejectAnnotation: ({
    commit
  }, annotation) => {
    commit("SET_REJECT_ANNOTATION", annotation);
  },
  setErrorMessageWidth: ({
    commit
  }, width) => {
    commit("SET_ERROR_MESSAGE_WIDTH", width);
  },

  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchAnnotations: ({
    commit,
    state,
    getters
  }) => {
    return HTTP.get(`documents/${state.documentId}/`)
      .then(async response => {
        if (response.data.annotation_sets) {
          const annotationSets = response.data.annotation_sets;
          const annotations = [];
          const labels = [];

          // group annotations for sidebar
          const sidebarAnnotationSets = annotationSets.map(annotationSet => {
            const sidebarLabels = annotationSet.labels.map(label => {
              // add annotations to the document array
              annotations.push(...label.annotations);
              // add labels to the labels array
              labels.push(label);
              // get grouped annotations
              const annotationsGrouped = getters.groupedAnnotations(
                label.annotations
              );
              const labelGrouped = {
                ...label,
                annotations: annotationsGrouped
              };
              return labelGrouped;
            });
            const annotationSetGrouped = {
              ...annotationSet,
              labels: sidebarLabels
            };
            return annotationSetGrouped;
          });
          // set information on the store
          commit("SET_SIDEBAR_ANNOTATION_SETS", sidebarAnnotationSets);
          commit("SET_ANNOTATION_SETS", annotationSets);
          commit("SET_ANNOTATIONS", annotations);
          commit("SET_LABELS", labels);

          // commit("SET_PAGES", []);

          const documentId = state.documentId;
          // fetch pages
          for (let i = 1; i <= response.data.number_of_pages; i++) {
            if (documentId === state.documentId) {
              // check if the document was not changed
              await HTTP.get(`documents/${documentId}/pages/${i}/`)
                .then(response => {
                  if (response.data && documentId === state.documentId) {
                    // if we already have the page in the state, update it in
                    // the pages array instead of creating a new one
                    const existingPageIndex = state.pages.findIndex(
                      p => p.number === i
                    );
                    if (existingPageIndex === -1) {
                      commit("ADD_PAGE", response.data);
                    } else {
                      let newPages = state.pages.slice(0);
                      newPages[i - 1] = response.data;
                      commit("SET_PAGES", newPages);
                    }
                  }
                })
                .catch(error => {
                  console.log(error, "Could not fetch pages from the backend");
                });
            } else {
              break;
            }
          }
        }
      })
      .catch(error => {
        console.log(error, "Could not fetch document details from the backend");
      });
  },

  setDocumentFocusedAnnotation: ({
    commit,
    state
  }, annotation) => {
    if (
      !state.documentFocusedAnnotation ||
      (annotation && state.documentFocusedAnnotation.id !== annotation.id)
    ) {
      commit("SET_DOCUMENT_FOCUSED_ANNOTATION", annotation);
    } else {
      commit("SET_DOCUMENT_FOCUSED_ANNOTATION", null);
    }
  },

  resetDocumentFocusedAnnotation: ({
    commit
  }) => {
    commit("SET_DOCUMENT_FOCUSED_ANNOTATION", null);
  },

  createAnnotation: ({
    commit
  }, annotation) => {
    return new Promise(resolve => {
      HTTP.post(`/annotations/`, annotation)
        .then(response => {
          if (response.status === 201) {
            commit("ADD_ANNOTATION", response.data);
            resolve(response.data);
          } else {
            resolve(null);
          }
        })
        .catch(error => {
          resolve(null);
          console.log(error);
        });
    });
  },

  updateAnnotation: ({
    commit
  }, {
    updatedValues,
    annotationId
  }) => {
    return new Promise(resolve => {
      HTTP.patch(`/annotations/${annotationId}/`, updatedValues)
        .then(response => {
          if (response.status === 200) {
            commit("UPDATE_ANNOTATION", response.data);
            resolve(response.data);
          }
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  deleteAnnotation: ({
    commit
  }, {
    annotationId
  }) => {
    return new Promise(resolve => {
      HTTP.delete(`/annotations/${annotationId}/`)
        .then(response => {
          commit("DELETE_ANNOTATION", annotationId);
          resolve(true);
        })
        .catch(error => {
          resolve(false);
          console.log(error);
        });
    });
  },

  updateDocument: ({
    commit,
    state
  }, updatedDocument) => {
    return new Promise(resolve => {
      HTTP.patch(`/documents/${state.documentId}/`, updatedDocument)
        .then(response => {
          if (response.status === 200) {
            // TODO: remove this after implementation in backend for is_category_accepted
            if (updatedDocument.is_category_accepted) {
              response.data.is_category_accepted = true;
            }

            commit("SET_SELECTED_DOCUMENT", response.data);
            resolve(response.status);
          }
        })
        .catch(error => {
          resolve(error);
          console.log(error);
        });
    });
  },

  fetchMissingAnnotations: ({
    commit,
    state
  }) => {
    return HTTP.get(
        `documents/${state.documentId}/missing-annotations/?limit=100`
      )
      .then(response => {
        commit("SET_MISSING_ANNOTATIONS", response.data.results);
      })
      .catch(error => {
        console.log(error);
      });
  },

  addMissingAnnotation: ({
    state
  }, missingAnnotation) => {
    return new Promise(resolve => {
      return HTTP.post(
          `documents/${state.documentId}/missing-annotations/`,
          missingAnnotation
        )
        .then(response => {
          if (response.status === 201) {
            resolve(true);
          }
        })
        .catch(error => {
          console.log(error);
          resolve(false);
        });
    });
  },

  deleteMissingAnnotation: ({
    state
  }, id) => {
    return new Promise(resolve => {
      return HTTP.delete(
          `documents/${state.documentId}/missing-annotations/${id}/`
        )
        .then(response => {
          if (response.status === 204) {
            resolve(true);
          }
        })
        .catch(error => {
          console.log(error);
          resolve(false);
        });
    });
  },

  fetchDocumentStatus: ({
    state
  }) => {
    return HTTP.get(
        `documents/${state.documentId}/?fields=status_data,labeling_available`
      )
      .then(response => {
        if (
          response.data.status_data === 2 &&
          response.data.labeling_available === 1
        ) {
          // TODO: use commit to mutate store
          state.documentIsReady = true;
        }

        if (response.data.status_data === 111) {
          // TODO: use commit to mutate store
          state.documentHasError = true;
        }
      })
      .catch(error => {
        console.log(error);
      });
  },

  // Get document data
  fetchDocumentData: ({
    commit,
    state
  }) => {
    return HTTP.get(`documents/${state.documentId}/`)
      .then(response => {
        commit("SET_SELECTED_DOCUMENT", response.data);
      })
      .catch(error => {
        console.log(error);
      });
  },

  fetchCurrentUser: ({
    commit
  }) => {
    return HTTP.get(`/auth/me/`).then(response => {
      commit("SET_CURRENT_USER", response.data.username);
    });
  },

  sleep: duration => {
    new Promise(resolve => setTimeout(resolve, duration));
  },

  pollDocumentEndpoint: ({
    state,
    dispatch
  }, duration) => {
    return dispatch("fetchDocumentStatus").then(async () => {
      if (state.documentIsReady) {
        return true;
      } else if (state.documentHasError) {
        dispatch("setDocumentError", true);
        return false;
      } else {
        dispatch("sleep", duration).then(() =>
          dispatch("pollDocumentEndpoint", duration)
        );
      }
    });
  }
};

const mutations = {
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },
  ADD_ANNOTATION: (state, annotation) => {
    state.annotations.push(annotation);
    state.annotationSets.map(annotationSet => {
      if (
        annotation.label_set &&
        annotationSet.label_set.id === annotation.label_set
      ) {
        annotationSet.labels.map(label => {
          if (annotation.label && annotation.label.id === label.id) {
            const exists = label.annotations.find(
              existingAnnotation => existingAnnotation.id === annotation.id
            );
            if (!exists) {
              label.annotations.push(annotation);
              return;
            }
          }
        });
      }
    });
    state.sidebarAnnotationSets.forEach(annotationSet => {
      if (
        annotation.annotation_set &&
        annotationSet.id === annotation.annotation_set
      ) {
        annotationSet.labels.map(label => {
          if (annotation.label && annotation.label.id === label.id) {
            const exists = label.annotations.find(
              existingAnnotation => existingAnnotation.id === annotation.id
            );
            if (!exists) {
              label.annotations.push(annotation);
              return;
            }
          }
        });
      }
    });
  },
  UPDATE_ANNOTATION: (state, annotation) => {
    const indexOfAnnotationInAnnotations = state.annotations.findIndex(
      existingAnnotation => existingAnnotation.id === annotation.id
    );
    if (indexOfAnnotationInAnnotations > -1) {
      state.annotations[indexOfAnnotationInAnnotations] = annotation;
    }
    state.annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        const indexOfAnnotationAnnotationSets = label.annotations.findIndex(
          existingAnnotation => existingAnnotation.id === annotation.id
        );
        if (indexOfAnnotationAnnotationSets > -1) {
          label.annotations[indexOfAnnotationAnnotationSets] = annotation;
          return;
        }
      });
    });

    let updatedAnnotation = false;
    state.sidebarAnnotationSets.forEach(annotationSet => {
      if (updatedAnnotation) {
        return;
      }
      annotationSet.labels.forEach(label => {
        if (updatedAnnotation) {
          return;
        }
        const indexOfAnnotationAnnotationSets = label.annotations.findIndex(
          existingAnnotation => existingAnnotation.id === annotation.id
        );
        if (indexOfAnnotationAnnotationSets > -1) {
          label.annotations[indexOfAnnotationAnnotationSets] = annotation;
          updatedAnnotation = true;
          return;
        } else {
          // find in grouped annotations
          label.annotations.forEach(annotationInLabel => {
            if (annotationInLabel.groupedAnnotations) {
              const indexOfAnnotationInGroups =
                annotationInLabel.groupedAnnotations.findIndex(
                  existingAnnotation => existingAnnotation.id === annotation.id
                );
              if (indexOfAnnotationInGroups > -1) {
                annotationInLabel.groupedAnnotations[
                  indexOfAnnotationInGroups
                ] = annotation;
                updatedAnnotation = true;
                return;
              }
            }
          });
        }
      });
    });
  },
  DELETE_ANNOTATION: (state, annotationId) => {
    const indexOfAnnotationToDelete = state.annotations.findIndex(
      existingAnnotation => existingAnnotation.id === annotationId
    );
    if (indexOfAnnotationToDelete > -1) {
      state.annotations.splice(indexOfAnnotationToDelete, 1);
    }
    state.annotationSets.map(annotationSet => {
      annotationSet.labels.map(label => {
        const indexOfAnnotationInLabelToDelete = label.annotations.findIndex(
          existingAnnotation => existingAnnotation.id === annotationId
        );
        if (indexOfAnnotationInLabelToDelete > -1) {
          label.annotations.splice(indexOfAnnotationInLabelToDelete, 1);
          return;
        }
      });
    });
    state.sidebarAnnotationSets.forEach(annotationSet => {
      annotationSet.labels.map(label => {
        const indexOfAnnotationInLabelToDelete = label.annotations.findIndex(
          existingAnnotation => existingAnnotation.id === annotationId
        );
        if (indexOfAnnotationInLabelToDelete > -1) {
          label.annotations.splice(indexOfAnnotationInLabelToDelete, 1);
          return;
        } else {
          // find in grouped annotations
          label.annotations.forEach(annotationInLabel => {
            if (annotationInLabel.groupedAnnotations) {
              const indexOfAnnotationInGroups =
                annotationInLabel.groupedAnnotations.findIndex(
                  existingAnnotation => existingAnnotation.id === annotationId
                );
              if (indexOfAnnotationInGroups > -1) {
                annotationInLabel.groupedAnnotations.splice(
                  indexOfAnnotationInGroups,
                  1
                );
                return;
              }
            }
          });
        }
      });
    });
  },
  SET_ANNOTATIONS: (state, annotations) => {
    state.annotations = annotations;
  },
  SET_ANNOTATION_SETS: (state, annotationSets) => {
    state.annotationSets = annotationSets;
  },
  SET_SIDEBAR_ANNOTATION_SETS: (state, annotationSets) => {
    state.sidebarAnnotationSets = annotationSets;
  },
  SET_LABELS: (state, labels) => {
    state.labels = labels;
  },
  SET_ANNOTATION_SELECTED: (state, annotation) => {
    state.sidebarAnnotationSelected = annotation;
  },
  SET_EDIT_ANNOTATION: (state, {
    id,
    index,
    label,
    labelSet
  }) => {
    state.editAnnotation = {
      id,
      index,
      label,
      labelSet
    };
  },
  RESET_EDIT_ANNOTATION: state => {
    state.editAnnotation = {
      id: null,
      index: 0
    };
  },
  ADD_PAGE: (state, page) => {
    state.pages.push(page);
  },
  SET_PAGES: (state, pages) => {
    state.pages = pages;
  },
  SET_DOCUMENT_FOCUSED_ANNOTATION: (state, documentFocusedAnnotation) => {
    state.documentFocusedAnnotation = documentFocusedAnnotation;
  },
  SET_SELECTED_DOCUMENT: (state, document) => {
    if (document.is_reviewed === true) {
      state.publicView = true;
    }
    state.selectedDocument = document;
  },
  SET_RECALCULATING_ANNOTATIONS: (state, recalculatingAnnotations) => {
    state.recalculatingAnnotations = recalculatingAnnotations;
  },
  SET_MISSING_ANNOTATIONS: (state, missingAnnotations) => {
    state.missingAnnotations = missingAnnotations;
  },
  SET_CURRENT_USER: (state, currentUser) => {
    state.currentUser = currentUser;
  },
  SET_EDITING_ACTIVE: (state, value) => {
    state.editingActive = value;
  },
  SET_SHOW_ERROR: (state, value) => {
    state.showError = value;
  },
  SET_ERROR_MESSAGE: (state, message) => {
    state.errorMessage = message;
  },
  SET_ACCEPT_ANNOTATION: (state, value) => {
    state.acceptAnnotation = value;
  },
  SET_DOCUMENT_ERROR: (state, value) => {
    state.showDocumentError = value;
  },
  SET_IMAGE_LOADED: (state, value) => {
    state.imageLoaded = value;
  },
  SET_REJECT_ANNOTATION: (state, annotation) => {
    state.rejectAnnotation = annotation;
  },
  SET_ERROR_MESSAGE_WIDTH: (state, width) => {
    state.errorMessageWidth = width;
  },
  SET_PUBLIC_VIEW: (state, value) => {
    state.publicView = value;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};