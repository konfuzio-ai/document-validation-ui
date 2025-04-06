import { createStore } from "vuex";

import display from "./display";
import document from "./document";
import category from "./category";
import project from "./project";
import selection from "./selection";
import edit from "./edit";

export const store = createStore({
  modules: {
    display,
    document,
    category,
    project,
    selection,
    edit,
  },
});
