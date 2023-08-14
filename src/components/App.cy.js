import App from "./App.vue";

describe("<App />", () => {
  it("renders and scrolls to 2nd page", () => {
    cy.mount(App);
    cy.wait(6500);
    cy.get(".document-thumbnail").eq(1).click();
  });
});
