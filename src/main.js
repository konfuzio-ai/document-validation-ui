import App from "./components/App";
import { createApp } from "vue";
import Buefy from "buefy";
import VueKonva from "vue-konva";
import { i18n } from "./i18n";
import { store } from "./store";
import VueObserveVisibility from "vue3-observe-visibility";
import Icons from "./icons";
import VueSplit from "vue3-split-panel";

const app = createApp(App);

app.component("VueFontawesome", Icons);
app.use(VueKonva);
app.use(Buefy, {
  defaultIconPack: "fas",
  defaultIconComponent: "vue-fontawesome",
});
app.use(VueObserveVisibility);
app.use(VueSplit);
app.use(store);
app.use(i18n);

/**
 * Main entrypoint for the App
 */
app.mount("#app");
