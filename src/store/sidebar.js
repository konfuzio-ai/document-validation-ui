import myImports from "../api";

const HTTP = myImports.HTTP;

const state = {
  activeLabelSet: null,
  annotationSets: null,
  annotationSelectedId: null,
  documentId: process.env.VUE_APP_DOCUMENT_ID
};

const getters = {
  /**
   * Get annotation sets grouped if there's one with the multiple
   * annotations property enabled.
   */
  groupedAnnotationSets: state => {
    if (state.annotationSets) {
      const tempAnnotationSets = [];
      state.annotationSets.map(annotationSet => {
        // check if the same label set already exists in the array
        const existingAnnotationSet = tempAnnotationSets.find(
          el => el.label_set.id === annotationSet.label_set.id
        );
        if (existingAnnotationSet && existingAnnotationSet.group) {
          existingAnnotationSet.group.push({
            id: annotationSet.id,
            label_set: annotationSet.label_set,
            labels: annotationSet.labels
          });
        } else {
          // add it to the annotation set array
          annotationSet.group = [
            {
              id: annotationSet.id,
              label_set: annotationSet.label_set,
              labels: annotationSet.labels
            }
          ];
          tempAnnotationSets.push(annotationSet);
        }
      });
      return tempAnnotationSets;
    }
    return null;
  },

  /**
   * Get annotations from the given label set, if there's none
   * return null to show the empty state
   */
  annotationsInLabelSet: state => annotationSet => {
    if (annotationSet) {
      const annotations = [];
      annotationSet.labels.map(label => {
        //add empty labels
        if (label.annotations.length === 0) {
          annotations.push({
            label_name: label.name,
            label_description: label.description,
            label_id: label.id,
            isOpen: false
          });
        } else {
          label.annotations.map(annotation => {
            annotations.push({
              ...annotation,
              label_name: label.name,
              label_description: label.description,
              label_id: label.id,
              isOpen: false
            });
          });
        }
      });
      return annotations;
    }
    return null;
  },
  /**
   * Get total annotations number in an annotation set
   */
  totalAnnotationsInAnnotationSet: state => annotationSet => {
    let counter = 0;
    if (annotationSet && annotationSet.group) {
      // search in every annotation group for how many annotations exist
      annotationSet.group.map(tempAnnotationSet => {
        tempAnnotationSet.labels.map(label => {
          if (label.annotations.length === 0) {
            // check empty labels
            counter = counter + 1;
          } else {
            counter = counter + label.annotations.length;
          }
        });
      });
    }
    return counter;
  },
  /**
   * Get total perfect confidence number in an annotation set
   */
  perfectConfidenceTotalInAnnotationSet: state => annotationSet => {
    let counter = 0;
    if (annotationSet && annotationSet.group) {
      // search in every annotation group for how many annotations
      // with a perfect confidence exist
      annotationSet.group.map(tempAnnotationSet => {
        tempAnnotationSet.labels.map(label => {
          label.annotations.map(annotation => {
            counter = counter + (annotation.accuracy === 1 ? 1 : 0);
          });
        });
      });
    }

    annotationSet.labels.map(label => {});
    return counter;
  }
};

const actions = {
  setDocId: ({ commit }, id) => {
    commit("SET_DOC_ID", id);
  },
  setAnnotationSelectedId: ({ commit }, id) => {
    commit("SET_ANNOTATION_SELECTED_ID", id);
  },
  setActiveLabelSet: ({ commit }, labelSet) => {
    commit("SET_ACTIVE_LABEL_SET", labelSet);
  },

  /**
   * Actions that use HTTP requests always return the axios promise,
   * so they can be `await`ed (useful to set the `loading` status).
   */
  fetchLabels: ({ commit, state }) => {
    return HTTP.get(`documents/${state.documentId}`)
      .then(response => {
        commit("SET_ANNOTATION_SETS", response.data.annotation_sets);
      })
      .catch(error => {
        console.log(error, "Could not fetch document data from the backend");
      });
  }
};

const mutations = {
  SET_DOC_ID: (state, id) => {
    state.documentId = id;
  },
  SET_ACTIVE_LABEL_SET: (state, labelSet) => {
    state.activeLabelSet = labelSet;
  },
  SET_ANNOTATION_SETS: (state, annotationSets) => {
    state.annotationSets = annotationSets;
  },
  SET_ANNOTATION_SELECTED_ID: (state, id) => {
    state.annotationSelectedId = id;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
