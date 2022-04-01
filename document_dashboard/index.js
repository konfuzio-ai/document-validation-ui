require("./styles/styles.scss");

import Vue from "vue";

import VueKonva from "vue-konva";

import store from "./store";
import DashboardData from "./DashboardData.vue";
import DashboardDocument from "./DashboardDocument.vue";

Vue.use(VueKonva);

Vue.component("document-dashboard-data", DashboardData);
Vue.component("document-dashboard", DashboardDocument);

/**
 * Main entrypoint for the Document Dashboard.
 */
var vm = new Vue({
  el: "#app",
  store
});
