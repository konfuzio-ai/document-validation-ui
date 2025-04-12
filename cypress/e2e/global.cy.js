/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe("DVUI test script", () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:8080/d/1375095/");
  });

  it("Edit document name", () => {
    const docName = `Test_${Date.now()}`;
    cy.intercept({
      method: "PATCH",
      url: "api/v3/documents/*",
      hostname: "testing.konfuzio.com",
    }).as("renameDoc");

    cy.get("#document-info .edit-btn.btn").click();
    cy.get("#document-info .document-name")
      .type("{selectall}{backspace}")
      .type(docName);
    cy.get("#document-info .save-btn.btn").click();
    cy.wait("@renameDoc").its("response.statusCode").should("eq", 200);
    cy.get("#document-info .document-name").contains(docName);
  });

  it("Thumbnail selection", () => {
    cy.get(".loading-thumbnail").should("not.exist");

    cy.get("#document-pages .document-thumbnail").each(($element, index) => {
      console.log("element", $element);
      cy.wrap($element).click();
      cy.get("#scrolling-document .scrolling-page")
        .eq(index)
        .should("be.visible");
    });
  });
});
