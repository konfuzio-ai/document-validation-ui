import { render } from "../utils/render";
import { dispatch, getData } from "../utils/store";
import {
  DocumentName,
  DocumentTopBar,
} from "../../src/components/DocumentTopBar";

describe("Document Top Bar", () => {
  it("Document Top Bar should be rendered", async () => {
    const wrapper = render(DocumentTopBar, true);

    expect(await wrapper.getComponent("#document-top-bar-component"));
  });

  it("File name should be visible", () => {
    const fileName = getData("document").selectedDocument.data_file_name;
    const wrapper = render(DocumentName, true, {
      dataFileName: fileName,
    });

    expect(wrapper.getComponent(".document-name").text()).toBe(fileName);
  });

  it("Edit button should be visible when rendering the component", async () => {
    const wrapper = render(DocumentName, true);

    expect(await wrapper.findComponent(".edit-btn").exists()).toBe(true);
  });

  it("Clicking on the edit button should make it not visible and make the save one visible", async () => {
    const wrapper = render(DocumentTopBar, false);

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(await wrapper.findComponent(".edit-btn").exists()).toBe(false);
    expect(await wrapper.findComponent(".save-btn").exists()).toBe(true);
  });

  it("No buttons should be visible while saving", async () => {
    const wrapper = render(DocumentTopBar, false);

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(await wrapper.findComponent(".edit-btn").exists()).toBe(false);

    await wrapper.getComponent(".save-btn").trigger("click");
    expect(await wrapper.findComponent(".save-btn").exists()).toBe(false);
  });

  it("The file name should become a content editable when clicking on the Edit button", async () => {
    const wrapper = render(DocumentTopBar, false);

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(wrapper.getComponent(".document-name").classes()).toContain(
      "is-editable"
    );
  });

  it("The file name should not be content editable after clicking the Save button", async () => {
    const wrapper = render(DocumentTopBar, false);

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    expect(
      await wrapper.findComponent(".document-name").classes()
    ).not.toContain("is-editable");
  });

  it("Clicking the save button should show the autosaving message to the user", async () => {
    const wrapper = render(DocumentTopBar, false);

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    expect(await wrapper.findComponent(".loading-container").exists()).toBe(
      true
    );
  });

  it("Check if save function is called after clicking save button", async () => {
    const wrapper = render(DocumentTopBar, false);

    const mockFn = jest.fn().mockName("saveFunction");

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    await mockFn();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("Keyboard icon is visible", async () => {
    const wrapper = render(DocumentTopBar, false);

    expect(await wrapper.find(".keyboard-actions-info").exists()).toBe(true);
  });

  it("Tooltip is visible on hover", async () => {
    const wrapper = render(DocumentTopBar, false);

    await wrapper
      .findComponent(".keyboard-actions-info .tooltip-trigger")
      .trigger("mouseenter");

    expect(
      await wrapper
        .find(".keyboard-actions-info .b-tooltip .tooltip-content")
        .isVisible()
    ).toBe(true);
  });

  it("Finish review button should be visible if not in edit mode, public view or review finished", async () => {
    const wrapper = render(DocumentTopBar, false);

    expect(
      await wrapper
        .findComponent(".top-bar-buttons .finish-review-button-container")
        .isVisible()
    ).toBe(true);
  });

  it("Finish review button should be disabled if review is not done", async () => {
    const wrapper = render(DocumentTopBar, false);

    expect(
      await wrapper
        .findComponent(
          ".top-bar-buttons .finish-review-button-container .finish-review-btn"
        )
        .attributes("disabled")
    ).toBe("disabled");
  });

  it("If document is in edit mode, button should not be visible", async () => {
    const wrapper = render(DocumentTopBar, false);

    await dispatch("edit/enableEditMode", true);

    expect(
      await wrapper
        .findComponent(
          ".top-bar-buttons .buttons .finish-review-button-container .action-buttons .finish-review-btn"
        )
        .exists()
    ).toBe(false);
  });

  it("Should not show Dropdown Set Chooser, option to edit file name, keyboard actions information or other buttons", async () => {
    const wrapper = render(DocumentTopBar, false);

    dispatch("document/setPublicView", true);

    const dropdownSetComponent = await wrapper.find(
      ".left-bar-components .document-set-dropdown"
    );

    const fileNameEditButton = await wrapper.find(
      ".document-name-component .edit-btn"
    );

    const keyboardActionInfo = await wrapper.find(
      ".right-bar-components .keyboard-actions-info"
    );

    const finishReviewButton = await wrapper.find(
      ".right-bar-components .top-bar-buttons .buttons .finish-review-button-container"
    );

    expect(dropdownSetComponent.exists()).toBe(false);
    expect(fileNameEditButton.exists()).toBe(false);
    expect(keyboardActionInfo.exists()).toBe(false);
    expect(finishReviewButton.exists()).toBe(false);
  });

  it("Shows arrows to navigate between documents", async () => {
    const wrapper = render(DocumentTopBar, false, null, {
      previousDocument: { id: 1 },
      nextDocument: { id: 3 },
    });

    expect(
      await wrapper
        .findComponent(".center-bar-components .navigation-arrow")
        .exists()
    ).toBe(true);
  });

  it("Arrows are not visible if there are no documents to navigate to", async () => {
    const wrapper = render(
      DocumentTopBar,
      false,
      {},
      {
        previousDocument: null,
        nextDocument: null,
      }
    );

    expect(
      await wrapper
        .findComponent(".center-bar-components .navigation-arrow")
        .isVisible()
    ).toBe(false);
  });

  it("Document Set Dropdown to appear when more than one document exists", async () => {
    dispatch("document/setPublicView", false);
    dispatch("edit/disableEditMode");
    const category = require("../mock/category.json");
    dispatch("category/setCategories", [category]);
    const wrapper = render(DocumentTopBar, false);

    const dropdownSetComponent = await wrapper.find(
      ".left-bar-components .document-set-dropdown"
    );

    expect(dropdownSetComponent.exists()).toBe(true);
  });

  it("Document Set Dropdown to not appear when in edit mode", async () => {
    dispatch("document/setPublicView", false);
    dispatch("edit/enableEditMode");

    const wrapper = render(DocumentTopBar, false);

    const dropdownSetComponent = await wrapper.find(
      ".left-bar-components .document-set-dropdown"
    );

    expect(dropdownSetComponent.exists()).toBe(false);
  });

  it("Document Set Dropdown to not appear when no documents exist in set", async () => {
    dispatch("document/setPublicView", false);
    dispatch("edit/disableEditMode");

    const newDocumentSet = getData("document").documentSet;
    newDocumentSet.documents = [];

    dispatch("document/setDocumentSet", newDocumentSet);
    const wrapper = render(DocumentTopBar, false);

    const dropdownSetComponent = await wrapper.find(
      ".left-bar-components .document-set-dropdown"
    );

    expect(dropdownSetComponent.exists()).toBe(false);
  });
});
