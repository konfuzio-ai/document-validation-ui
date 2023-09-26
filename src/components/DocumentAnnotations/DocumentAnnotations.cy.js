import DocumentAnnotations from "./DocumentAnnotations.vue";

describe("Document Annotations", () => {
  beforeEach(() => {
    cy.fetchDocument();
    cy.dispatchAction("document", "setPublicView", false);
    cy.dispatchAction("edit", "disableEditMode");
    cy.mount(DocumentAnnotations);
  });

  it("shows loading when there are no annotation sets loaded yet or when loading the data", () => {
    cy.dispatchAction("document", "setAnnotationSets", null);
    cy.mount(DocumentAnnotations);
    cy.get("#document-annotations")
      .find(".document-annotations-loading")
      .its("length")
      .should("equal", 1);

    
    cy.dispatchAction("document", "startLoading");
    cy.get("#document-annotations")
      .find(".document-annotations-loading")
      .its("length")
      .should("equal", 1);
  });

  it("shows 3 rows of loading annotation sets", () => {
    cy.dispatchAction("document", "startLoading");
    cy.get("#document-annotations")
      .find(".loading-annotation-set")
      .its("length")
      .should("equal", 3);
  });

  it("shows all annotation sets", () => { 
    cy.get("#document-annotations")
      .find(".annotation-set-group")
      .then(($elements) => {
        cy.getStore("document")
          .then($document => {
            expect($document.annotationSets).to.have.lengthOf($elements.length);
          })
      });
  });

  it("shows the empty state if there are no annotation sets", () => {
    cy.dispatchAction("document", "setAnnotationSets", []);
    
    cy.get("#document-annotations")
      .find(".empty-annotation-sets")
      .find(".empty-container")
      .find(".title")
      .should('be.visible');
  });

  it("shows no annotation set action buttons if the document is read only", () => {
    cy.dispatchAction("document", "setPublicView", true);
    
    cy.get("#document-annotations")
      .find(".labelset-action-buttons")
      .should("not.be.visible");
  });

  it("renders action buttons for the annotation sets and annotations", () => {
    cy.get("#document-annotations")
      .find(".labelset-action-buttons")
      .should("be.visible");

    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".buttons-container")
      .should("exist");
  });

  it("does not show annotations action buttons by default", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".buttons-container")
      .should("not.be.visible");
  });

  it("clicks each annotation and empty annotation and checks that it is in edit mode", () => {  
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".annotation-value")
      .not(".missing-annotation")
      .each($annotation => {
        cy.wrap($annotation)
          .should("not.have.class", "clicked-ann")
        cy.wrap($annotation)
          .click();
        cy.wrap($annotation)
          .should("have.class", "clicked-ann")
        cy.wait(1000);
      })
  });

  it("clicks each annotation and shows action buttons", () => {  
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".annotation")
      .each(($row) => {
        cy.wrap($row)
          .find(".annotation-value")
          .click();

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-save-btn")
          .should("be.visible")
          

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-cancel-btn")
          .should("be.visible")
        
        
        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-cancel-btn")
          .click();

        cy.wait(1000);
      });
  });

  it("shows accept and decline buttons when hovering annotation", () => { 
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".not-revised")
      .each(($row) => {
        cy.wrap($row)
          .trigger("mouseover");

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".decline-button-container")
          .should("be.visible");
          
        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-accept-btn")
          .should("be.visible");

        cy.wait(1000);
      });
  });

  it("clicks each empty annotation and shows action buttons", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .find(".annotation-value")
      .each(($annotation) => {
        if ($annotation.hasClass("missing-annotation")) {
          return;
        } else {
          cy.wrap($annotation)
          .click();

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-cancel-btn")
          .should("be.visible");
          
        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-cancel-btn")
          .click();

        cy.wait(1000);
        }
      });     
  });

  it("shows mark as missing button when hovering empty annotation", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .find(".annotation-value")
      .not(".missing-annotation")
      .each(($annotation) => {
        cy.wrap($annotation)
          .trigger("mouseover");

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".missing-button-container")
          .should("be.visible");
          
        cy.wait(1000);
      })
  });

  it("marks empty annotation as missing", () => { 
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .find(".annotation-value")
      .not(".missing-annotation")
      .each(($annotation) => {
        cy.wrap($annotation)
          .trigger("mouseover");

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".missing-button-container")
          .find(".missing-btn")
          .click();        

        cy.wrap($annotation)
          .trigger("mouseleave");

        cy.wait(1000);
      });

      cy.get("#document-annotations")
        .find(".label")
        .find(".annotation-row")
        .find(".empty-annotation")
        .then($elements => {

          cy.getStore("document")
            .then($document => {
              expect($document.missingAnnotations)
                .to.have.lengthOf($elements.length);
          });
        });
  });

  it("restores empty annotation", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .find(".missing-annotation")
      .each(($annotation) => {
        cy.wrap($annotation)
          .trigger("mouseover");

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".restore-btn")
          .click();

        cy.wrap($annotation)
          .trigger("mouseleave");

        cy.wait(1000);
      });

    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .should("not.have.class", "missing-annotation");
  });

  it("gets successfull response from the API when accepting annotation", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".not-revised")
      .first()
      .then(($element) => {
        const annotationId = $element[0].id;
      
        cy.intercept('PATCH', `**/annotations/${annotationId}/`).as('updateAnnotation');
        
        cy.wrap($element)
          .trigger("mouseover");

        cy.wait(1000);

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".annotation-accept-btn")
          .click();
        
        cy.wait("@updateAnnotation").its("response.statusCode").should("eq", 200);
      });
  });

  it("gets successfull response from the API when declining annotation", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".annotation")
      .first()
      .then(($element) => {
        const annotationId = $element[0].id;
      
        cy.intercept('DELETE', `**/annotations/${annotationId}/`).as('deleteAnnotation');
        
        cy.wrap($element)
          .trigger("mouseover");

        cy.wait(1000);

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".decline-btn")
          .click();
        
        cy.wait("@deleteAnnotation").its("response.statusCode").should("eq", 204);
      });
  });

  it("gets successfull response from the API when marking annotation as missing", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .first()
      .then(($element) => {       
        cy.intercept('POST', `**/missing-annotations/`).as('addMissingAnnotations');
        
        cy.wrap($element)
          .trigger("mouseover");

        cy.wait(1000);

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".missing-btn")
          .click();
        
        cy.wait("@addMissingAnnotations").its("response.statusCode").should("eq", 201);
      });
  });

  it("gets successfull response from the API when restoring missing annotation", () => {
    cy.get("#document-annotations")
      .find(".label")
      .find(".annotation-row")
      .find(".empty-annotation")
      .find(".missing-annotation")
      .first()
      .then(($element) => {
        
        cy.getStore("document").then($document => {
          cy.intercept('DELETE', `**/missing-annotations/${$document.missingAnnotations[0].id}/`).as('deleteMissingAnnotation');
        })
        
        cy.wrap($element)
          .trigger("mouseover");

        cy.wait(1000);

        cy.get("#document-annotations")
          .find(".label")
          .find(".annotation-row")
          .find(".action-buttons")
          .find(".restore-btn")
          .click();
        
        cy.wait("@deleteMissingAnnotation").its("response.statusCode").should("eq", 204);
      });
  });
});