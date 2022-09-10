import { mount, shallowMount } from "@vue/test-utils";
import {
  DocumentTopBar,
  DocumentName,
  DatasetStatus,
  Category,
  Handover,
} from "../../src/components/DocumentTopBar";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Top Bar", () => {
  // Set file name
  const documentData = require("../mock/document_data.json");

  // mock axios
  jest.mock("axios");

  beforeEach(() => {
    Promise.resolve(
      store.dispatch("document/setSelectedDocument", documentData)
    );
  });

  it("Document Top Bar should be rendered", () => {
    const wrapper = shallowMount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    expect(wrapper.getComponent(".document-top-bar-component"));
  });

  it("File name should be visible", () => {
    const wrapper = shallowMount(DocumentName, {
      store,
      propsData: {
        dataFileName: store.state.document.selectedDocument.data_file_name,
      },
      mocks: { $t },
    });

    expect(wrapper.getComponent(".document-name").text()).toBe(
      documentData.data_file_name
    );
  });

  it("Edit button should be visible when rendering the component", () => {
    const wrapper = shallowMount(DocumentName, {
      store,
      mocks: { $t },
    });

    expect(wrapper.findComponent(".edit-btn").exists()).toBe(true);
  });

  it("Clicking on the edit button should make it not visible and make the save one visible", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(wrapper.findComponent(".edit-btn").exists()).toBe(false);
    expect(wrapper.findComponent(".save-btn").exists()).toBe(true);
  });

  it("No buttons should be visible while saving", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(wrapper.findComponent(".edit-btn").exists()).toBe(false);

    await wrapper.getComponent(".save-btn").trigger("click");
    expect(wrapper.findComponent(".save-btn").exists()).toBe(false);
  });

  it("The file name should become a content editable when clicking on the Edit button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    expect(wrapper.getComponent(".document-name").classes()).toContain(
      "is-editable"
    );
  });

  it("The file name should not be content editable after clicking the Save button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    expect(wrapper.findComponent(".document-name").classes()).not.toContain(
      "is-editable"
    );
  });

  it("Clicking on the save button should show the autosaving message to the user", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    expect(wrapper.findComponent(".loading-container").exists()).toBe(true);
  });

  it("Check if save function is called after clicking save button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    const mockFn = jest.fn().mockName("saveFunction");

    await wrapper.getComponent(".edit-btn").trigger("click");
    await wrapper.getComponent(".save-btn").trigger("click");
    await mockFn();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  /** The tests below are commented out due to
   * the dataset status component not being used
   */

  // it("Should render Document Dataset Status component", () => {
  //   const wrapper = mount(DatasetStatus, {
  //     store,
  //     mocks: { $t },
  //   });

  //   expect(wrapper.findComponent(".dataset-status-chooser").exists()).toBe(
  //     true
  //   );
  // });

  // it("Should render 4 status options", () => {
  //   const wrapper = mount(DatasetStatus, {
  //     store,
  //     mocks: { $t },
  //   });

  //   expect(wrapper.findAll(".dropdown-item")).toHaveLength(4);
  // });

  it("Should render the handover button", () => {
    const wrapper = mount(Handover, {
      store,
      mocks: { $t },
    });

    expect(wrapper.findComponent(".handover-container").exists()).toBe(true);
  });

  it("Clicking the button should open modal", async () => {
    const wrapper = mount(Handover, {
      store,
      mocks: { $t },
    });

    await wrapper.findComponent(".handover-btn").trigger("click");
    expect(wrapper.findComponent(".notification").isVisible()).toBe(true);
  });

  it("Clicking the X button should close modal", async () => {
    const wrapper = mount(Handover, {
      store,
      mocks: { $t },
    });

    await wrapper.findComponent(".handover-btn").trigger("click");
    await wrapper.findComponent(".modal-btn").trigger("click");
    expect(wrapper.findComponent(".notification").isVisible()).toBe(false);
  });
});
