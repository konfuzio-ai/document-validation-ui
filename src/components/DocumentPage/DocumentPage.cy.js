import DocumentDashboard from "../DocumentDashboard.vue";
import DocumentPage from "../DocumentPage/DocumentPage.vue";

describe("Document Page", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.setFullMode();
  });

  it("All annotations appear at the right place", () => {
    cy.getStore("document").then(($document) => {
      if (
        $document.selectedDocument.pages[0] &&
        $document.annotations &&
        $document.annotations.length > 0
      ) {
        cy.setScale($document.selectedDocument.pages[0]);
        cy.fetchBlob(
          `${$document.selectedDocument.pages[0].image_url}?${$document.selectedDocument.downloaded_at}`
        ).then((blob) => {
          cy.mount(DocumentPage, {
            propsData: {
              page: $document.selectedDocument.pages[0],
              imageBlob: blob,
            },
          }).then(({ wrapper, component }) => {
            $document.annotations.forEach((annotation) => {
              const values = component.annotationRect(annotation.span[0]);
              const coordinates = {
                x: values.x,
                y: values.y,
              };
              cy.get(".pdf-page-container").scrollIntoView({
                offset: { top: coordinates.y, left: coordinates.x },
              });
              cy.wait(5000);
              cy.get(".pdf-page-container").click(coordinates.x, coordinates.y);

              cy.getStore("document").then(($newDocument) => {
                if ($newDocument.sidebarAnnotationSelected) {
                  expect(
                    $newDocument.sidebarAnnotationSelected.annotation.id
                  ).to.eql(annotation.id);
                } else {
                  throw new Error("Annotation not on right place");
                }
              });
            });
          });
        });
      }
    });
  });

  it.only("Can click on an entity", () => {
    cy.getStore("document").then(($document) => {
      if (
        $document.selectedDocument.pages[0] &&
        $document.annotations &&
        $document.annotations.length > 0
      ) {
        cy.setScale($document.selectedDocument.pages[0]);
        cy.fetchBlob(
          `${$document.selectedDocument.pages[0].image_url}?${$document.selectedDocument.downloaded_at}`
        ).then((blob) => {
          cy.mount(DocumentPage, {
            propsData: {
              page: $document.selectedDocument.pages[0],
              imageBlob: blob,
            },
          }).then(({ wrapper, component }) => {
            console.log("document", $document);
            if ($document.pages && $document.pages.length > 0) {
              const entities = $document.pages.map((page) => {
                return { ...page.entities };
              });
              console.log("entitys", entities);
              const entity = Math.floor(Math.random() * entities.length);
            }
          });
        });
      }
    });
  });

  it("Can create a bounding box", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
    });
  });
});
