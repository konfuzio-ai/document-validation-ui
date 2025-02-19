import App from "./components/App";
import Vue from "vue";
import Buefy from "buefy";
import VueKonva from "vue-konva";
import i18n from "./i18n";
import store from "./store";
import VueObserveVisibility from "vue-observe-visibility";
import Icons from "./icons";
import VueSplit from "vue-split-panel";

Vue.component("VueFontawesome", Icons);
Vue.component("App", App);
Vue.use(VueKonva);
Vue.use(Buefy, {
  defaultIconPack: "fas",
  defaultIconComponent: "vue-fontawesome",
});
Vue.use(VueObserveVisibility);
Vue.use(VueSplit);

/**
 * Main entrypoint for the App
 */
new Vue({
  i18n,
  store,
  el: "#app",
});
