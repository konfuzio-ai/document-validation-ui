import DocumentEdit from "./DocumentEdit.vue";

describe("Document Edit", () => {
  beforeEach(() => {
		cy.fetchDocument();

		cy.dispatchAction("document", "setPublicView", false);
    cy.dispatchAction("edit", "enableEditMode");
	});

  it("Shows edit mode - split, rotate & reorder view", () => {

  });

  it("Shows as many preview pages as the document has", () => {

  });

  it("Shows as many thumbnails as the document has", () => {

  });

  it("Shows the sidebar & buttons", () => {

  });

  it("Shows disabled automatic splitting switch & tooltip when hovering if no splitting suggestions", () => {

  });

  it("Can toggle automatic splitting switch & no tooltip when hovering if there are splitting suggestions", () => {

  });

  it("Clicking thumbnail selects it", () => {

  });

  it("Clicking thumbnail enables rotate buttons", () => {

  });

  it("Rotates the selected thumbnails", () => {

  });

  it("Rotates all thumbnails", () => {

  });

  it("Can drag and drop to reorder pages", () => {

  });

  it("Shows the splitting lines", () => {

  });

  it("Clicking splitting lines creates new documents", () => {

  });

  it("Shows the splitting points if there are splitting suggestions", () => {

  });
});