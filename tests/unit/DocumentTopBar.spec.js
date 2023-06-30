import { mount, shallowMount } from "@vue/test-utils";
import {
  DocumentTopBar,
  DocumentName,
} from "../../src/components/DocumentTopBar";
import { DocumentCategory } from "../../src/components";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Top Bar", () => {
  // Set file name
  const documentData = require("../mock/document.json");
  const pages = [
    require("../mock/page_1.json"),
    require("../mock/page_2.json"),
  ];
  documentData.pages = pages;

  beforeEach(() => {
    Promise.resolve(
      store.dispatch("document/setSelectedDocument", documentData),
      store.dispatch(
        "document/setAnnotationSets",
        require("../mock/document.json").annotation_sets
      ),
      store.dispatch("document/setPublicView", false),
      store.dispatch("document/endRecalculatingAnnotations"),
      store.dispatch("document/endLoading")
    );
  });

  it("Document Top Bar should be rendered", async () => {
    const wrapper = shallowMount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.getComponent(".document-top-bar-component"));
  });

  it("File name should be visible", () => {
    const wrapper = shallowMount(DocumentName, {
      store,
      propsData: {
        dataFileName: store.state.document.selectedDocument.data_file_name,
      },
      mocks: {
        $t,
      },
    });

    expect(wrapper.getComponent(".document-name").text()).toBe(
      documentData.data_file_name
    );
  });

  it("Edit button should be visible when rendering the component", async () => {
    const wrapper = shallowMount(DocumentName, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.findComponent(".edit-btn").exists()).toBe(true);
  });

  it("Clicking on the edit button should make it not visible and make the save one visible", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(await wrapper.findComponent(".edit-btn").exists()).toBe(false);
    expect(await wrapper.findComponent(".save-btn").exists()).toBe(true);
  });

  it("No buttons should be visible while saving", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(await wrapper.findComponent(".edit-btn").exists()).toBe(false);

    await wrapper.getComponent(".save-btn").trigger("click");
    expect(await wrapper.findComponent(".save-btn").exists()).toBe(false);
  });

  it("The file name should become a content editable when clicking on the Edit button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(wrapper.getComponent(".document-name").classes()).toContain(
      "is-editable"
    );
  });

  it("The file name should not be content editable after clicking the Save button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    expect(
      await wrapper.findComponent(".document-name").classes()
    ).not.toContain("is-editable");
  });

  it("Clicking the save button should show the autosaving message to the user", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    expect(await wrapper.findComponent(".loading-container").exists()).toBe(
      true
    );
  });

  it("Check if save function is called after clicking save button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    const mockFn = jest.fn().mockName("saveFunction");

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    await mockFn();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("Keyboard icon is visible", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.find(".keyboard-actions-info").exists()).toBe(true);
  });

  it("Tooltip is visible on hover", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

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
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .findComponent(".top-bar-buttons .finish-review-button-container")
        .isVisible()
    ).toBe(true);
  });

  it("Finish review button should be disabled if review is not done", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .findComponent(
          ".top-bar-buttons .finish-review-button-container .finish-review-btn"
        )
        .attributes("disabled")
    ).toBe("disabled");
  });

  it("If document is in edit mode, button should not be visible", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await store.dispatch("edit/enableEditMode", true);

    expect(
      await wrapper
        .findComponent(
          ".top-bar-buttons .buttons .finish-review-button-container .action-buttons .finish-review-btn"
        )
        .exists()
    ).toBe(false);
  });

  it("Should not show Category dropdown, option to edit file name, keyboard actions information or other buttons", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    store.dispatch("document/setPublicView", true);

    const categoryDropdown = await wrapper.find(
      ".left-bar-components .dropdown"
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

    expect(categoryDropdown.exists()).toBe(false);
    expect(fileNameEditButton.exists()).toBe(false);
    expect(keyboardActionInfo.exists()).toBe(false);
    expect(finishReviewButton.exists()).toBe(false);
  });

  it("Category dropdown is disabled if the Document belongs to a dataset, or if there are Annotations that are correct", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const labels = annotationSet.labels;
    const annotations = labels.flatMap((label) => {
      return label.annotations;
    });
    const correctAnnotations = annotations.filter((ann) => ann.is_correct);

    const wrapper = mount(DocumentCategory, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          dropdownIsDisabled: false,
          tooltipIsShown: false,
        };
      },
    });

    if (correctAnnotations.length > 0) {
      await wrapper.setData({ dropdownIsDisabled: true, tooltipIsShown: true });
    }

    expect(
      await wrapper
        .findComponent(".b-tooltip .tooltip-trigger .dropdown")
        .classes()
    ).toContain("is-disabled");

    await wrapper
      .findComponent(".b-tooltip .tooltip-trigger")
      .trigger("mouseenter");

    expect(await wrapper.find(".b-tooltip .tooltip-content").isVisible()).toBe(
      true
    );
  });
});
