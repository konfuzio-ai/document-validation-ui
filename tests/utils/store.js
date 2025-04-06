import { store } from "../../src/store";

export const init = () => {
  const documentData = require("../mock/document.json");
  const documentSet = require("../mock/document_set.json");
  const pages = [
    require("../mock/page_1.json"),
    require("../mock/page_2.json"),
  ];
  documentData.pages = pages;

  const annotations = [];
  const annotationSets = documentData.annotation_sets;
  annotationSets.map((annotationSet) => {
    annotationSet.labels.map((label) => {
      annotations.push(...label.annotations);
    });
  });

  // mock scale for scrolling pages
  const scale = {
    elementsWidth: 1,
    client: {
      width: 1600,
      height: 1200,
    },
    viewport: {
      width: pages[0].size[0],
      height: pages[0].size[1],
    },
  };

  Promise.resolve(
    store.dispatch("document/setSelectedDocument", documentData),
    store.dispatch("document/setAnnotations", annotations),
    store.dispatch("document/setAnnotationSets", annotationSets),
    store.dispatch("document/setPages", pages),
    store.dispatch("document/setPublicView", false),
    store.dispatch("document/setDocumentSet", documentSet),
    store.dispatch("document/endRecalculatingAnnotations"),
    store.dispatch("document/endLoading"),
    store.dispatch("display/updateScale", scale)
  );

  return store;
};

// returns promise
export const dispatch = (path, params) => {
  return store.dispatch(path, params);
};

export const getData = (storeName) => {
  if (store) {
    return store.state[storeName];
  }
  return null;
};

export const getGetter = (getterName) => {
  if (store) {
    return store.getters[getterName];
  }
  return null;
};
