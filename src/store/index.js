import Vue from "vue";
import Vuex from "vuex";

import display from "./display";
import document from "./document";
import category from "./category";
import project from "./project";
import selection from "./selection";
import edit from "./edit";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    display,
    document,
    category,
    project,
    selection,
    edit
  }
});