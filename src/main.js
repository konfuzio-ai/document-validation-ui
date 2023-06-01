import Vue from "vue";
import Buefy from "buefy";
import VueKonva from "vue-konva";
import App from "./components/App";
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";
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

// Sentry config
if (process.env.NODE_ENV != "development") {
  Sentry.init({
    Vue,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    integrations: [new Integrations.BrowserTracing()],
    environment: process.env.VUE_APP_SENTRY_ENVIRONMENT,

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,

    // If false, errors won't show up in devtools
    logErrors: true,

    tracingOptions: {
      trackComponents: true,
    },
  });
}

/**
 * Main entrypoint for the App
 */
new Vue({
  i18n,
  store,
  el: "#app",
});
