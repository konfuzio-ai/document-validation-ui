require("./styles/styles.scss");

import Vue from "vue";

import VueKonva from "vue-konva";
import store from "./store";
import App from "./App.vue";

Vue.use(VueKonva);

/**
 * Main entrypoint for the Document Dashboard.
 */
new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
