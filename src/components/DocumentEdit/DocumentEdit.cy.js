import DocumentEdit from "./DocumentEdit.vue";

describe("Document Edit", () => {
  beforeEach(() => {
    cy.fetchDocument().then(() => {
      cy.getStore("project")
        .then($project => {
          cy.fetchCategories($project.projectId);
        });
    });
    cy.setFullMode();
    cy.dispatchAction("edit", "enableEditMode");
    cy.dispatchAction("edit", "setRenameAndCategorize", false);
    cy.mount(DocumentEdit);
  });

  it("Shows edit mode - split, rotate & reorder view", () => {
    cy.get("#document-edit").find(".pages-section").should("be.visible");
  });

  it("Shows as many thumbnails as the document has", () => {
    cy.getStore("document").then(($document) => {
      const pages = $document.selectedDocument.pages;
      const pagesLength = pages.length;

      cy.get("#document-edit")
        .find(".pages-section")
        .find(".edit-pages")
        .find(".document-grid")
        .find(".image-section")
        .its("length")
        .should("equal", pagesLength);
    });
  });

  it("Shows the sidebar & buttons", () => {
    cy.get("#document-edit").find(".sidebar").should("be.visible");

    cy.get("#document-edit")
      .find(".sidebar")
      .find(".edit-buttons")
      .find(".sidebar-buttons")
      .its("length")
      .should("equal", 4);
  });

  it("Enables & disables automatic splitting switch, shows and hides 'new' badge, splitting suggestions info bar & tooltip when hovering if there are or not splitting suggestions", () => {
    cy.get("#document-edit")
      .find(".sidebar")
      .find(".smart-split")
      .should("be.visible");

    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.proposed_split) {
        cy.get("#document-edit")
          .find(".sidebar")
          .find(".smart-split")
          .find(".split-switch")
          .should("not.have.class", "is-disabled");

        cy.get("#document-edit")
          .find(".sidebar")
          .find(".smart-split")
          .find(".switch-info")
          .find(".new-badge")
          .should("be.visible");

        cy.get("#document-edit")
          .find(".pages-section")
          .find(".info-bar")
          .find(".split-info-bar")
          .should("be.visible");
      } else {
        cy.get("#document-edit")
          .find(".sidebar")
          .find(".smart-split")
          .find(".split-switch")
          .should("have.class", "is-disabled");

        cy.get("#document-edit")
          .find(".sidebar")
          .find(".smart-split")
          .trigger("mouseenter");

        cy.get("#document-edit")
          .find(".sidebar")
          .find(".smart-split")
          .find(".split-tooltip")
          .should("be.visible");
      }
    });
  });

  it("Can toggle automatic splitting switch if there are splitting suggestions", () => {
    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.proposed_split) {
        cy.get("#document-edit")
          .find(".sidebar")
          .find(".smart-split")
          .find(".split-switch")
          .click();

        cy.get("#document-edit")
          .find(".pages-section")
          .find(".info-bar")
          .find(".split-info-bar")
          .should("not.exist");

        cy.get("#document-edit")
          .find(".pages-section")
          .find(".image-section")
          .find(".splitting-lines")
          .find(".lines")
          .should("have.class", "not-active-split");

        cy.getStore("edit").then(($edit) => {
          expect($edit.updatedDocument).to.have.lengthOf(1);
        });
      }
    });
  });

  it("Shows the splitting points if there are splitting suggestions", () => {
    cy.getStore("document").then(($document) => {
      if ($document.selectedDocument.proposed_split) {
        const split = $document.selectedDocument.proposed_split;
        const splitLength = split.length;

        cy.get("#document-edit")
          .find(".pages-section")
          .find(".image-section")
          .find(".splitting-lines")
          .find(".active-split")
          .its("length")
          .should("equal", splitLength);
      }
    });
  });

  it("Shows the splitting lines by default when no suggestions, and the visible lines should be number of pages, and last one not visible", () => {
    cy.getStore("document").then(($document) => {
      const pages = $document.selectedDocument.pages;
      const pagesLength = pages.length;

      if (!$document.selectedDocument.proposed_split && $document.pages.length > 1) {
        cy.get("#document-edit")
          .find(".pages-section")
          .find(".image-section")
          .find(".splitting-lines")
          .find(".lines")
          .should("have.class", "not-active-split")
          .and(($lines) => {
            expect($lines).to.have.lengthOf(pagesLength);
            expect($lines[pagesLength - 1]).not.to.be.visible;
          });
      }
    });
  });

  it("Clicking splitting lines creates new documents", () => {
    cy.getStore("document").then(($document) => {
      if ($document.pages.length > 1) {
        if ($document.selectedDocument.proposed_split) {
          cy.get("#document-edit")
            .find(".sidebar")
            .find(".smart-split")
            .find(".split-switch")
            .click();

          cy.wait(1000);
        }

        cy.get("#document-edit")
          .find(".pages-section")
          .find(".image-section")
          .find(".splitting-lines")
          .find(".lines")
          .first()
          .click();

        cy.getStore("edit").then(($edit) => {
          expect($edit.updatedDocument).to.have.lengthOf(2);
        });
      }
    });
  });

  it("Clicking thumbnail selects & removes selection", () => {
    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .click();

    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .should("have.class", "selected");

    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .click();

    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .should("not.have.class", "selected");
  });

  it("Clicking thumbnail enables rotate selected buttons", () => {
    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .click();

    cy.get("#document-edit")
      .find(".sidebar")
      .find(".edit-buttons")
      .find(".sidebar-buttons")
      .find(".edit-mode-btn")
      .first()
      .should("not.be.disabled");

    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .click();

    cy.get("#document-edit")
      .find(".sidebar")
      .find(".edit-buttons")
      .find(".sidebar-buttons")
      .find(".edit-mode-btn")
      .first()
      .should("be.disabled");
  });

  it("Rotates the selected thumbnails", () => {
    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .click();

    cy.get("#document-edit")
      .find(".sidebar")
      .find(".edit-buttons")
      .find(".sidebar-buttons")
      .find(".edit-mode-btn")
      .first()
      .click();

    cy.getStore("edit").then(($edit) => {
      expect($edit.pagesForPostprocess[0].angle).to.equal(-90);
    });
  });

  it("Rotates all thumbnails", () => {
    cy.get("#document-edit")
      .find(".sidebar")
      .find(".edit-buttons")
      .find(".sidebar-buttons")
      .find(".edit-mode-btn")
      .last()
      .click();

    cy.getStore("edit").then(($edit) => {
      $edit.pagesForPostprocess.map((page) => {
        expect(page.angle).to.equal(90);
      });
    });
  });

  it("Can drag and drop to reorder pages", () => {
    cy.getStore("edit").then(($edit) => {
      if ($edit.pagesForPostprocess.length > 1) {
        const firstPageId = $edit.pagesForPostprocess[0].id;
        cy.get(
          "#document-edit .pages-section .edit-pages .document-grid .image-section:last-child"
        ).drag(
          "#document-edit .pages-section .edit-pages .document-grid .image-section:first-child"
        );
        cy.getStore("edit").then(($newEdit) => {
          const newFirstPageId = $newEdit.pagesForPostprocess[0].id;
          expect(newFirstPageId).to.not.equal(firstPageId);
        });
      } else {
        cy.log("Can't test drag and drop, this document has only one page");
      }
    });
  });

  it("Shows edit mode - rename and categorize view", () => {
    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    cy.get("#document-edit").find(".rename-and-categorize-section").should("be.visible");
  });

  it("Changes visible page when clicking the thumbnail", () => {
    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".thumbnail")
      .last()
      .click();

    cy.getStore("display").then($display => {
      cy.getStore("edit").then($edit => {
        const length = $edit.updatedDocument.length;
        const page = $edit.updatedDocument[length - 1].pages[0].number;

        expect($display.currentPage).to.equal(page);
      });
    });
  });

  it("Shows correct name for the new documents", () => {
    let fileName;

    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    cy.getStore("document")
      .then($document => {
        fileName = $document.selectedDocument.data_file_name;
        fileName = fileName.split(".").slice(0, -1).join(".");
      });

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".file-name-section")
      .each(($document, index) => {
        let name;
        if (index === 0) {
          name = fileName;
        } else if (index === 1) {
          name = `${fileName}_copy`;
        } else {
          name = `${fileName}_copy${index}`;
        }

        cy.wrap($document)
          .find(".name-input")
          .invoke('val')
          .then($text => {
            expect($text).to.equal(name);
          });
      });

  });

  it("Changes name of the first document", () => {
    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    let inputValue;

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".file-name-section")
      .find(".name-input")
      .first()
      .then($firstInput => {
        cy.wrap($firstInput)
          .invoke('val')
          .then($text => {
            inputValue = $text;
          });

        cy.wrap($firstInput).click();
      });

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".file-name-section")
      .find(".name-input")
      .first()
      .type('{selectAll}')
      .type('{backspace}')
      .type("test-name");

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".file-name-section")
      .find(".name-input")
      .first()
      .then($firstInput => {
        cy.wrap($firstInput)
          .invoke('val')
          .then($text => {
            expect($text).to.not.equal(inputValue);
          });
      });
  });

  it("Shows correct name for the new documents", () => {
    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".category")
      .each(($categoryRow, index) => {

        cy.getStore("edit")
          .then($edit => {
            cy.gettersStore().then(($getters) => {
              const categoryName = $getters["category/categoryName"]($edit.updatedDocument[index].category);

              cy.wrap($categoryRow)
                .find(".category-name")
                .contains(categoryName);
            });
          });
      });
  });

  it("Shows category confidence if automatic split", () => {
    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".category")
      .each(($categoryRow, index) => {
        cy.getStore("edit")
          .then($edit => {
            cy.gettersStore().then(($getters) => {
              const found = $edit.updatedDocument[index].categories.find(category =>
                category.id === $edit.updatedDocument[index].category
              );

              const confidence = $getters["category/categoryConfidence"](found.confidence);

              cy.wrap($categoryRow)
                .find(".category-name")
                .contains(confidence);
            });
          });
      });
  });

  it("Can change the category from the dropdown", () => {
    cy.dispatchAction("edit", "setRenameAndCategorize", true);

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".category")
      .find(".category-drop-down")
      .first()
      .click();

    cy.get("#document-edit")
      .find(".rename-and-categorize-section")
      .find(".document-details")
      .find(".doc-info")
      .find(".category")
      .first()
      .then($categoryRow => {
        cy.getStore("edit")
          .then($edit => {
            cy.gettersStore().then(($getters) => {
              const categoryName = $getters["category/categoryName"]($edit.updatedDocument[0].category);

              cy.wrap($categoryRow)
                .find(".list-item")
                .first()
                .click();

              cy.wrap($categoryRow)
                .find(".category-name")
                .should("not.contain", categoryName);
            });
          });
      });
  });
});
