import Vue from "vue";
import Buefy from "buefy";
import VueObserveVisibility from "vue-observe-visibility";
import { init as initStore } from "./utils/store";

Vue.use(VueObserveVisibility);
Vue.use(Buefy);

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
