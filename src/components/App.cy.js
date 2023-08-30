import App from "./App.vue";

describe("App", () => {
  it("renders the app", () => {
    cy.mount(App);
  });
});
