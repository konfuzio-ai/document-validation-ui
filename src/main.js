import Vue from "vue";
import Buefy from "buefy";
import VueKonva from "vue-konva";
import App from "./components/App";
import i18n from "./i18n";
import store from "./store";
import { library } from "@fortawesome/fontawesome-svg-core";
import VueObserveVisibility from "vue-observe-visibility";

// internal icons
import {
  faArrowUp,
  faAngleRight,
  faAngleLeft,
  faAngleUp,
  faAngleDown,
  faSpinner,
  faPlus,
  faXmark,
  faEllipsisVertical,
  faCircleInfo,
  faArrowRotateLeft,
  faArrowRotateRight,
  faScissors,
  faRepeat,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faArrowUp,
  faAngleRight,
  faAngleLeft,
  faAngleUp,
  faAngleDown,
  faSpinner,
  faXmark,
  faSpinner,
  faPlus,
  faEllipsisVertical,
  faCircleInfo,
  faArrowRotateLeft,
  faArrowRotateRight,
  faScissors,
  faRepeat,
  faArrowLeft,
  faArrowRight
);
Vue.component("VueFontawesome", FontAwesomeIcon);
Vue.component("App", App);
Vue.use(VueKonva);
Vue.use(Buefy, {
  defaultIconPack: "fas",
  defaultIconComponent: "vue-fontawesome",
});
Vue.use(VueObserveVisibility);

/**
 * Main entrypoint for the App
 */
new Vue({
  i18n,
  store,
  el: "#app",
});
