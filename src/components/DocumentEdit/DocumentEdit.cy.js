import DocumentEdit from "./DocumentEdit.vue";

describe("Document Edit", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.setFullMode();
    cy.dispatchAction("edit", "enableEditMode");
    cy.dispatchAction("edit", "setRenameAndCategorize", false);
    cy.mount(DocumentEdit);
  });

  it("Shows edit mode - split, rotate & reorder view", () => {
    cy.get("#document-edit")
      .find(".pages-section")
      .should("be.visible");
  });

  it("Shows as many thumbnails as the document has", () => {
    cy.getStore("document").then(($document) => {
      const pages = $document.selectedDocument.pages
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
    cy.get("#document-edit")
      .find(".sidebar")
      .should("be.visible");

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

    cy.getStore("document").then($document => {
      if($document.selectedDocument.proposed_split) {
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
    cy.getStore("document").then($document => {
      if($document.selectedDocument.proposed_split) {
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

        cy.getStore("edit").then($edit => {
          expect($edit.updatedDocument).to.have.lengthOf(1);
        });
      }
    });
  });

  it("Shows the splitting points if there are splitting suggestions", () => {
    cy.getStore("document").then($document => {
      if($document.selectedDocument.proposed_split) {
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

  it("Shows the splitting lines by default when no suggestions, and the visible lines should be number of pages - 1", () => {
    cy.getStore("document").then($document => {
      const pages = $document.selectedDocument.pages
      const pagesLength = pages.length;

      if(!$document.selectedDocument.proposed_split) {
        cy.get("#document-edit")
          .find(".pages-section")
          .find(".image-section")
          .find(".splitting-lines")
          .find(".lines")
          .should("have.class", "not-active-split")
          .and($lines => {
            expect($lines).to.have.lengthOf(pagesLength - 1);
          });
      }
    });
  });

  it("Clicking splitting lines creates new documents", () => {
    cy.getStore("document").then($document => {
      if($document.selectedDocument.proposed_split) {
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
      
      cy.getStore("edit").then($edit => {
        expect($edit.updatedDocument).to.have.lengthOf(2);
      });
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
    
    cy.getStore("edit").then($edit => {
      expect($edit.pagesForPostprocess[0].angle).to.equal(-90);
    })
  });

  it("Rotates all thumbnails", () => {
    cy.get("#document-edit")
      .find(".sidebar")
      .find(".edit-buttons")
      .find(".sidebar-buttons")
      .find(".edit-mode-btn")
      .last()
      .click();

    cy.getStore("edit").then($edit => {
      $edit.pagesForPostprocess.map(page => {
        expect(page.angle).to.equal(90);
      })
    });
  });

  it("Can drag and drop to reorder pages", () => {
    cy.getStore("edit").then($edit => {
      console.log("before", $edit.pagesForPostprocess);
    });

    cy.get("#document-edit")
      .find(".pages-section")
      .find(".edit-pages")
      .find(".document-grid")
      .find(".image-section")
      .find(".top-section")
      .find(".edit-page-thumbnail")
      .find(".page-thumbnail")
      .first()
      .then($element => {
        const clientRec = $element[0].getBoundingClientRect();

        // cy.get("#document-edit")
        //   .find(".pages-section")
        //   .find(".edit-pages")
        //   .find(".document-grid")
        //   .find(".image-section")
        //   .find(".top-section")
        //   .find(".edit-page-thumbnail")
        //   .find(".page-thumbnail")
        //   .last()
        //   .trigger("mousedown", { which: 1 }, { force: true })
        //   .wait(1500)
        //   .trigger('mousemove', {  
        //     clientX: clientRec.x,
        //     clientY: clientRec.y,
        //     screenX: clientRec.x,
        //     screenY: clientRec.y,
        //     pageX: clientRec.x,
        //     pageY: clientRec.y 
        //   }, {force: true})
        //   .trigger('mouseup', { force: true });

        cy.get("#document-edit")
          .find(".pages-section")
          .find(".edit-pages")
          .find(".document-grid")
          .find(".image-section")
          .find(".top-section")
          .find(".edit-page-thumbnail")
          .find(".page-thumbnail")
          .last()
          .dragElement(-400, -90);
    
        cy.getStore("edit").then($edit => {
          console.log("after", $edit.pagesForPostprocess);
        });
      });
  });
});
