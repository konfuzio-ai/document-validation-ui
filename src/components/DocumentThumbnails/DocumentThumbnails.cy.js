import DocumentThumbnails from "./DocumentThumbnails.vue";

describe("Document Thumbnails", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.mount(DocumentThumbnails);
  });

  it("shows thumbnails for all document pages", () => {
    cy.get("#document-pages")
      .find(".document-thumbnail")
      .then(($elements) => {
        cy.getStore("document")
          .then($document => {
            expect($document.selectedDocument.pages)
              .to.have.lengthOf($elements.length);
          });
      });
  });

  it("loads thumbnail pictures that are shown on screen", () => {
    cy.intercept("GET", "**/page/show-thumbnail/**").as("getThumbnail");

    cy.get("#document-pages")
      .find(".document-thumbnail")
      .then((elements) => {
        cy.get("@getThumbnail.all")
          .its("length")
          .should("equal", elements.length);
      });
  });

  it("displays page number correctly", () => {
    cy.get("#document-pages")
      .find(".document-thumbnail")
      .each(($row, index) => {
        cy.wrap($row)
          .find(".number-thumbnail")
          .contains(index + 1);
        cy.wait(1000);
      });
  });

  it("navigates to every document thumbnail", () => {
    cy.get("#document-pages")
      .find(".document-thumbnail")
      .each(($row, index) => {
        cy.wrap($row).click();
        cy.getStore("display")
          .then($display => {
            expect($display.currentPage)
              .to.equal(index + 1);
          });

        cy.wait(1000);
      });
  });

  it("show loading when a document is not set", () => {
    cy.mount(DocumentThumbnails);
    cy.dispatchAction("document", "setSelectedDocument", null);
    cy.get("#document-pages")
      .find(".document-thumbnail-loading")
      .its("length")
      .should("equal", 1);
  });
});
