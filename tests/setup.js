import App from "../src/components/App";
import { createApp } from "vue";
import Buefy from "buefy";
import VueObserveVisibility from "vue3-observe-visibility";
import { init as initStore } from "./utils/store";

const app = createApp(App);
app.use(VueObserveVisibility);
app.use(Buefy);

initStore();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return null;
  }

  unobserve() {
    return null;
  }
};
