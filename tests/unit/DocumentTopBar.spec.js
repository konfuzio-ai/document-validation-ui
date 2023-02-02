import { mount, shallowMount } from "@vue/test-utils";
import {
  DocumentTopBar,
  DocumentName,
  Handover,
} from "../../src/components/DocumentTopBar";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Top Bar", () => {
  // Set file name
  const documentData = require("../mock/document_data.json");
  const pages = [
    require("../mock/page_1.json"),
    require("../mock/page_2.json"),
  ];
  documentData.pages = pages;

  beforeEach(() => {
    Promise.resolve(
      store.dispatch("document/setSelectedDocument", documentData),
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

  it("Clicking on the save button should show the autosaving message to the user", async () => {
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

  it("Should render the handover button", async () => {
    const wrapper = mount(Handover, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.findComponent(".handover-container").exists()).toBe(
      true
    );
  });

  it("Clicking the button should open modal", async () => {
    const wrapper = mount(Handover, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.findComponent(".handover-btn").trigger("click");
    expect(await wrapper.findComponent(".notification").isVisible()).toBe(true);
  });

  it("Clicking the X button should close modal", async () => {
    const wrapper = mount(Handover, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.findComponent(".handover-btn").trigger("click");
    await wrapper.findComponent(".modal-btn").trigger("click");
    expect(await wrapper.findComponent(".notification").isVisible()).toBe(
      false
    );
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
        .findComponent(
          ".top-bar-buttons .buttons .finish-review-button-container .action-buttons .finish-review-btn"
        )
        .isVisible()
    ).toBe(true);
  });

  it("If document has been reviewed, document should be in public mode and button disabled", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .findComponent(
          ".top-bar-buttons .buttons .finish-review-button-container .action-buttons .finish-review-btn"
        )
        .attributes("disabled")
    ).not.toBe("undefined");
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
});
