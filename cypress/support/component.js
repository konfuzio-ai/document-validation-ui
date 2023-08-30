import { mount } from "cypress/vue2";
import Vue from "vue";
import Vuex from "vuex";
import Buefy from "buefy";
import VueObserveVisibility from "vue-observe-visibility";
import VueKonva from "vue-konva";
import store from "../../src/store";
import api from "../../src/api";
import i18n from "../../src/i18n";
import Icons from "../../src/icons";

Cypress.Commands.add("mount", (component, options = {}) => {
  // Setup options object
  options.global = options.global || {};
  options.extensions = options.extensions || {};
  options.extensions.plugins = options.extensions.plugins || [];

  // Use store passed in from options, or initialize a new one
  options.store = options.store || store;

  // Use i18n passed in from options, or initialize a new one
  options.i18n = options.i18n || i18n;

  // Load Buefy
  Vue.component("VueFontawesome", Icons);
  Vue.use(Buefy, {
    defaultIconPack: "fas",
    defaultIconComponent: "vue-fontawesome",
  });

  // Add plugins
  options.extensions.plugins.push(VueKonva);
  options.extensions.plugins.push(Vuex);
  options.extensions.plugins.push(VueObserveVisibility);

  return mount(component, options);
});

Cypress.Commands.add("store", () => store);

Cypress.Commands.add("fetchDocument", () => {
  api.setApiUrl(process.env.VUE_APP_API_URL);
  api.setImageUrl(process.env.VUE_APP_DOCUMENT_IMAGES_URL);
  api.setAuthToken(process.env.VUE_APP_GUEST_USER_TOKEN);
  cy.store().invoke("dispatch", "document/fetchDocument");
  cy.wait(1000);
});

Cypress.Commands.add("storeState", (store, state) => {
  cy.store().its("state").its(store).its(state);
});

Cypress.Commands.add("dispatchAction", (store, action, value) => {
  cy.store().invoke("dispatch", `${store}/${action}`, value);
});

// Ignore resize observe error
Cypress.on("uncaught:exception", (err, runnable) => {
  if (err.message.includes("ResizeObserver")) {
    cy.stub();
    return false;
  }
});
