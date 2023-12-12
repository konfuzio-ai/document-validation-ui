import DocumentPage from "../DocumentPage/DocumentPage.vue";
import SearchBar from "../DocumentPage/SearchBar.vue";

const viewport = {
  width: 1280,
  height: 1300,
};

describe("Document Page", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.setFullMode();
    cy.viewport(viewport.width, viewport.height);
  });

  it("Search for text in the document", () => {
    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.pages[0]) {
        cy.setScale($document.selectedDocument.pages[0]);
        cy.fetchBlob(
          `${$document.selectedDocument.pages[0].image_url}?${$document.selectedDocument.downloaded_at}`
        ).then((blob) => {
          cy.mount(SearchBar).then(({ wrapper, component }) => {
            if ($document.pages && $document.pages.length > 0) {
              const entities = $document.pages.flatMap((page) => {
                return page.entities;
              });
              let entity;
              do {
                entity = entities[Math.floor(Math.random() * entities.length)]; // get a random entity
              } while (!entity || entity.offset_string.length < 3);

              cy.dispatchAction("display", "enableSearch", true);
              cy.dispatchAction(
                "display",
                "setCurrentSearch",
                entity.offset_string
              );
              cy.wait(2000);
              cy.getStore("display").then(($display) => {
                expect($display.searchResults.length).to.be.greaterThan(0);
              });
            }
          });
        });
      } else {
        throw new Error("Document not loaded");
      }
    });
  });

  it("Navigate to next search result if exists", () => {
    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.pages[0]) {
        cy.setScale($document.selectedDocument.pages[0]);
        cy.fetchBlob(
          `${$document.selectedDocument.pages[0].image_url}?${$document.selectedDocument.downloaded_at}`
        ).then((blob) => {
          cy.mount(SearchBar).then(({ wrapper, component }) => {
            cy.wait(2000);
            if ($document.pages && $document.pages.length > 0) {
              const entities = $document.pages.flatMap((page) => {
                return page.entities;
              });
              let entity;
              do {
                entity = entities[Math.floor(Math.random() * entities.length)]; // get a random entity
              } while (!entity || entity.offset_string.length < 3);

              cy.dispatchAction("display", "enableSearch", true);
              cy.dispatchAction(
                "display",
                "setCurrentSearch",
                entity.offset_string
              );
              cy.wait(2000);
              cy.getStore("display").then(($display) => {
                if ($display.searchResults.length > 1) {
                  expect(component.currentCounter).to.be.eql(1);
                  cy.get("#document-search .next-search").click();
                  cy.getStore("display").then(() => {
                    expect(component.currentCounter).to.be.eql(2);
                  });
                } else {
                  cy.get("#document-search .next-search").should("be.disabled");
                }
              });
            }
          });
        });
      } else {
        throw new Error("Document not loaded");
      }
    });
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
              if (values.y < viewport.height) {
                // check if ann is visible on viewport
                cy.get(".pdf-page-container").click(values.x, values.y);

                cy.getStore("document").then(($newDocument) => {
                  if ($newDocument.sidebarAnnotationSelected) {
                    expect(
                      $newDocument.sidebarAnnotationSelected.annotation.id
                    ).to.eql(annotation.id);
                  } else {
                    throw new Error("Annotation not on right place");
                  }
                });
              }
            });
          });
        });
      } else {
        throw new Error("Document has no annotations");
      }
    });
  });

  it("Can click on an entity", () => {
    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.pages[0]) {
        cy.setScale($document.selectedDocument.pages[0]);
        cy.fetchBlob(
          `${$document.selectedDocument.pages[0].image_url}?${$document.selectedDocument.downloaded_at}`
        ).then((blob) => {
          cy.mount(DocumentPage, {
            propsData: {
              page: $document.pages[0],
              imageBlob: blob,
            },
          }).then(({ wrapper, component }) => {
            if ($document.pages && $document.pages.length > 0) {
              const entities = $document.pages.flatMap((page) => {
                return page.entities;
              });
              const entity =
                entities[Math.floor(Math.random() * entities.length)]; // get a random entity
              const values = component.entityRect(entity);
              if (values.y < viewport.height) {
                cy.get(".pdf-page-container").click(values.x, values.y);
                cy.get(".annotation-popup").should("exist");
              }
            } else {
              cy.get(".annotation-popup").should("not.exist");
            }
          });
        });
      } else {
        throw new Error("Document has no pages");
      }
    });
  });
});
