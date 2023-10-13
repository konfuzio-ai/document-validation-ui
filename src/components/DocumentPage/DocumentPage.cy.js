import DocumentDashboard from "../DocumentDashboard.vue";
import DocumentPage from "../DocumentPage";

describe("Document Page", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.setFullMode();
  });

  it.only("Annotation appears at the right place", () => {
    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.pages[0]) {
        console.log("document", $document.selectedDocument);
        console.log("page", $document.selectedDocument.pages[0]);
        cy.mount(DocumentPage, {
          props: {
            page: $document.selectedDocument.pages[0],
          },
        });
      }
    });
  });

  it("Can click on an existing annotation", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
    });
  });

  it("Can click on an entity", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
    });
  });

  it("Can create a bounding box", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
    });
  });

  it("Hovering an annotation selects the annotation the annotation list", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
    });
  });
});
