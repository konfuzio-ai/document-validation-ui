import App from "./App.vue";

describe("<App />", () => {
  it("renders and scrolls to 2nd page", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(App, {
      propsData: {
        locale: "en",
        document: "1369831",
        api_url: "https://testing.konfuzio.com/api/v3",
        image_url: "https://testing.konfuzio.com/",
      },
    });
    cy.wait(6500);
    cy.get(".document-thumbnail").eq(1).click();
  });
});
