import DocumentDashboard from "../DocumentDashboard.vue";
import DocumentPage from "../DocumentPage/DocumentPage.vue";

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
        cy.setScale($document.selectedDocument.pages[0]);
        cy.fetchBlob(
          `${$document.selectedDocument.pages[0].image_url}?${$document.selectedDocument.downloaded_at}`
        ).then((blob) => {
          console.log("blob", blob);
          cy.mount(DocumentPage, {
            propsData: {
              page: $document.selectedDocument.pages[0],
              imageBlob: blob,
            },
          }).then(({ wrapper, component }) => {
            console.log("component", component);
          });
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
