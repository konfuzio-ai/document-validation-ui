import Vue from "vue";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
import VueKonva from "vue-konva";
import store from "./store";
import App from "./App";
import * as Sentry from "@sentry/vue";
import {
  Integrations
} from "@sentry/tracing";
import i18n from "./i18n";

import {
  library
} from "@fortawesome/fontawesome-svg-core";
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
  faCircleInfo
} from "@fortawesome/free-solid-svg-icons";
import {
  FontAwesomeIcon
} from "@fortawesome/vue-fontawesome";

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
  faCircleInfo
);
Vue.component("vue-fontawesome", FontAwesomeIcon);

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
 * Main entrypoint for the Document Dashboard.
 */
new Vue({
  store,
  i18n,
  render: h => h(App)
}).$mount("#app");