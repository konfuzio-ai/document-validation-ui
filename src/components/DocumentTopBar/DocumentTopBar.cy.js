import DocumentTopBar from "./DocumentTopBar";

describe("Document Top Bar", () => {
	let currentDocument;

	beforeEach(() => {
		cy.fetchDocument().then(() => {
			cy.getStore("document")
				.then($document => {
					currentDocument = $document.selectedDocument;
				});

			cy.getStore("project")
				.then($project => {
					cy.fetchCategories($project.projectId);
				});
		});
		cy.dispatchAction("document", "setPublicView", false);
		cy.dispatchAction("edit", "disableEditMode");
		cy.mount(DocumentTopBar);
	});

	it("Shows category dropdown if not edit mode or reviewed", () => {
		cy.dispatchAction("edit", "disableEditMode");

		cy.get("#document-top-bar-component")
			.find(".left-bar-components")
			.find(".category-chooser")
			.should("be.visible");
	});

	it("Shows correct file name", () => {
		const fileName = currentDocument.data_file_name;

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.should("be.visible");

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".document-name")
			.contains(fileName);
	});

	it("Shows arrows if available documents to navigate to", () => {
		cy.fetchDocumentList();
		const assignee = currentDocument.assignee;

		cy.getStore("project")
			.then($project => {
				cy.gettersStore().then(($getters) => {
					const filtered = $project.documentsInProject.filter(
						(document) =>
							($getters["document/waitingForSplittingConfirmation"](document) || $getters["document/isDocumentReadyToBeReviewed"](document)
							) && document.assignee === assignee
					);

					if (filtered.length > 0) {
						cy.get("#document-top-bar-component")
							.find(".center-bar-components")
							.find(".navigation-arrow")
							.should("be.visible");
					}
				});
			});
	});

	it("Shows keyboard icon", () => {
		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".keyboard-actions-info")
			.should("be.visible");
	});

	it("Shows disabled finish review button", () => {
		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".top-bar-buttons")
			.find(".finish-review-button-container")
			.should("be.visible");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".top-bar-buttons")
			.find(".finish-review-button-container")
			.find(".finish-review-btn")
			.should("be.disabled");
	});

	it("Shows edit mode buttons", () => {
		cy.dispatchAction("edit", "enableEditMode");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".top-bar-buttons")
			.find(".finish-review-button-container")
			.should("not.exist");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".top-bar-buttons")
			.find(".edit-mode-buttons")
			.should("be.visible");
	});

	it("Edits file name", () => {
		const newName = "test-name";

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".edit-btn")
			.click();

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".document-name")
			.should("have.class", "is-editable");

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".document-name")
			.type('{selectAll}')
			.type('{backspace}')
			.type(newName);

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".save-btn")
			.should("be.visible");

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".save-btn")
			.click();

		cy.wait(1000);

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.find(".cloud-icon")
			.should("be.visible");

		cy.wait(1000);

		cy.get("#document-top-bar-component")
			.find(".center-bar-components")
			.find(".document-name-component")
			.contains(newName);
	});

	it("Shows tooltip when hovering over keyboard info", () => {
		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".keyboard-actions-info")
			.trigger("mouseenter");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".keyboard-actions-info")
			.find(".keyboard-actions-description")
			.should("be.visible");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".keyboard-actions-info")
			.trigger("mouseleave");
	});

	it("Closes edit mode when clicking 'back to annotation view' button", () => {
		cy.dispatchAction("edit", "enableEditMode");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".edit-mode-buttons")
			.should("exist");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".edit-mode-buttons")
			.find(".button-cancel")
			.then(($button) => {
				if (!$button.is(':disabled')) {
					cy.wrap($button)
						.click();

					cy.wait(1000);

					cy.get("#document-top-bar-component")
						.find(".right-bar-components")
						.find(".edit-mode-buttons")
						.should("not.exist");
				}

			});

	});

	it("Shows rename and categorize section when clicking 'next' button", () => {
		cy.dispatchAction("edit", "enableEditMode");

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".edit-mode-buttons")
			.find(".button-next")
			.click();

		cy.wait(1000);

		cy.get("#document-top-bar-component")
			.find(".right-bar-components")
			.find(".edit-mode-buttons")
			.find(".submit-btn")
			.should("be.visible");
	});
});