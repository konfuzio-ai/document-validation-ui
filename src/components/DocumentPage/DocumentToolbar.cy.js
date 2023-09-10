import DocumentDashboard from "../DocumentDashboard.vue";

describe("Document Toolbar", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.setFullMode();
  });

  it("downloads the original file", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      cy.get("#toolbar-container").find(".download-file").first().click();
      cy.get("#toolbar-container").get(".original-file").click();

      cy.getStore("document").then(($document) => {
        cy.readFile(
          `cypress/Downloads/${$document.selectedDocument.data_file_name}`,
          { timeout: 20000 }
        ).should("exist");
      });
    });
  });

  it("downloads the ocr file", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      cy.get("#toolbar-container").find(".download-file").first().click();
      cy.get("#toolbar-container").get(".ocr-file").click();

      cy.getStore("document").then(($document) => {
        const fileName = $document.selectedDocument.data_file_name.replace(
          /(\.[\w\d_-]+)$/i,
          "_ocr$1"
        );
        cy.readFile(`cypress/Downloads/${fileName}`, { timeout: 20000 }).should(
          "exist"
        );
      });
    });
  });

  it("zooms in the document", () => {
    cy.resetFit();
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      const previousZoom = component.scale;
      const previousDocumentWidth =
        component.$refs.scrollingDocument.$el.offsetWidth;
      cy.get("#toolbar-container").should("be.visible");

      // zoom in
      cy.get("#toolbar-container").get(".zoom-in").click();

      // check if percentage was updated
      cy.get("#zoom-percentage")
        .invoke("text")
        .then(($text) => {
          expect($text.trim()).to.not.eql("100%");
        });

      // check if width of document page has increased
      cy.get("#scrolling-document")
        .get(".scrolling-page")
        .first()
        .find(".pdf-page-container")
        .invoke("width")
        .then(($width) => {
          expect($width).to.be.greaterThan(previousDocumentWidth);
        });

      // check if document scale has increased
      cy.getStore("display").then(($display) => {
        expect($display.scale).to.be.greaterThan(previousZoom);
        expect($display.fit).to.eql("custom");
      });
    });
  });

  it("zooms out the document", () => {
    cy.resetFit();
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      const previousZoom = component.scale;
      const previousDocumentWidth =
        component.$refs.scrollingDocument.$el.offsetWidth;
      cy.get("#toolbar-container").should("be.visible");

      // zoom out
      cy.get("#toolbar-container").get(".zoom-out").click();

      // check if percentage was updated
      cy.get("#zoom-percentage")
        .invoke("text")
        .then(($text) => {
          expect($text.trim()).to.not.eql("100%");
        });

      // check if width of document page has decreased
      cy.get("#scrolling-document")
        .get(".scrolling-page")
        .first()
        .find(".pdf-page-container")
        .invoke("width")
        .then(($width) => {
          expect($width).to.be.lessThan(previousDocumentWidth);
        });

      // check if document scale has decreased
      cy.getStore("display").then(($display) => {
        expect($display.scale).to.be.lessThan(previousZoom);
        expect($display.fit).to.eql("custom");
      });
    });
  });

  it("fit document zoom", () => {
    cy.resetFit();
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      const previousZoom = component.scale;
      const previousDocumentWidth =
        component.$refs.scrollingDocument.$el.offsetWidth;
      cy.get("#toolbar-container").should("be.visible");

      // fit zoom
      cy.get("#toolbar-container").get(".fit-zoom").click();

      // check if percentage goes to half
      cy.get("#zoom-percentage")
        .invoke("text")
        .then(($text) => {
          expect($text.trim()).to.eql("50%");
        });

      // check if width of document page has decreased
      cy.get("#scrolling-document")
        .get(".scrolling-page")
        .first()
        .find(".pdf-page-container")
        .invoke("width")
        .then(($width) => {
          expect($width).to.be.lessThan(previousDocumentWidth);
        });

      // check if document scale has decreased
      cy.getStore("display").then(($display) => {
        expect($display.scale).to.be.lessThan(previousZoom);
        expect($display.fit).to.eql("all");
      });
    });
  });

  it("fit document zoom after zoom in", () => {
    cy.resetFit();
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      const previousZoom = component.scale;
      const previousDocumentWidth =
        component.$refs.scrollingDocument.$el.offsetWidth;
      cy.get("#toolbar-container").should("be.visible");

      // zoom in
      cy.get("#toolbar-container").get(".zoom-in").click();
      cy.wait(1000);
      // fit zoom
      cy.get("#toolbar-container").get(".fit-zoom").click();

      // check if percentage goes to half
      cy.get("#zoom-percentage")
        .invoke("text")
        .then(($text) => {
          expect($text.trim()).to.eql("50%");
        });

      // check if width of document page has decreased
      cy.get("#scrolling-document")
        .get(".scrolling-page")
        .first()
        .find(".pdf-page-container")
        .invoke("width")
        .then(($width) => {
          expect($width).to.be.lessThan(previousDocumentWidth);
        });

      // check if document scale has decreased comparing to the initial 100% state
      cy.getStore("display").then(($display) => {
        expect($display.scale).to.be.lessThan(previousZoom);
        expect($display.fit).to.eql("all");
      });
    });
  });

  it("check if edit mode is available and open it", () => {
    cy.mount(DocumentDashboard).then(({ wrapper, component }) => {
      component.onDocumentResize();
      cy.gettersStore().then(($getters) => {
        if (
          $getters["edit/isEditModeAvailable"] &&
          !$getters["document/documentCannotBeEdited"]()
        ) {
          cy.get("#edit-mode-button").click();
          cy.get("#document-annotations").should("not.exist");
          cy.get("#document-edit").should("exist");
        } else if ($getters["document/documentCannotBeEdited"]()) {
          cy.get("#edit-mode-button").should(
            "have.class",
            "edit-mode-disabled"
          );
        } else {
          cy.get("#edit-mode-button").should("not.exist");
        }
      });
    });
  });
});
