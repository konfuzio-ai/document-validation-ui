import Vue from "vue";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
import VueKonva from "vue-konva";
import App from "./components/App";
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";
import i18n from "./i18n";

import { library } from "@fortawesome/fontawesome-svg-core";
// internal icons
import {
  faArrowUp,
  faAngleRight,
  faAngleLeft,
  faAngleDown,
  faFile,
  faSpinner,
  faCheck,
  faXmark,
  faEllipsisVertical,
  faUser,
  faCircleInfo,
  faArrowRotateLeft,
  faArrowRotateRight,
  faScissors,
  faRepeat,
  faEye,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faArrowUp,
  faAngleRight,
  faAngleLeft,
  faAngleDown,
  faCheck,
  faFile,
  faSpinner,
  faXmark,
  faEllipsisVertical,
  faUser,
  faCircleInfo,
  faArrowRotateLeft,
  faArrowRotateRight,
  faScissors,
  faRepeat,
  faEye,
  faArrowLeft
);
Vue.component("vue-fontawesome", FontAwesomeIcon);
Vue.component("App", App);
Vue.use(VueKonva);
Vue.use(Buefy, {
  defaultIconPack: "fas",
  defaultIconComponent: "vue-fontawesome"
});

// Sentry config
if (process.env.NODE_ENV != "development") {
  Sentry.init({
    Vue,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    integrations: [new Integrations.BrowserTracing()],
    environment: process.env.NODE_ENV,

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,

    // If false, errors won't show up in devtools
    logErrors: true,

    tracingOptions: {
      trackComponents: true
    }
  });
}

/**
 * Main entrypoint for the App
 */
new Vue({
  i18n,
  el: "#app"
});
