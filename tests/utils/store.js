import store from "../../src/store";

export const init = () => {
  const documentData = require("../mock/document.json");
  const pages = [
    require("../mock/page_1.json"),
    require("../mock/page_2.json"),
  ];
  documentData.pages = pages;

  Promise.resolve(
    store.dispatch("document/setSelectedDocument", documentData),
    store.dispatch(
      "document/setAnnotationSets",
      require("../mock/document.json").annotation_sets
    ),
    store.dispatch("document/setPublicView", false),
    store.dispatch("document/endRecalculatingAnnotations"),
    store.dispatch("document/endLoading")
  );
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
