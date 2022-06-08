import Vue from "vue";
import Vuex from "vuex";

import display from "./display";
import document from "./document";
import category from "./category";
import selection from "./selection";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    display,
    document,
    category,
    selection
  }
});