import { mount } from "@vue/test-utils";
import { DocumentTopBar } from "../../src/components/DocumentTopBar";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Top Bar", () => {
  // Set file name
  const fileName = require("../mock/document_data.json").data_file_name;

  // mock axios
  jest.mock("axios");

  beforeEach(() => {
    Promise.resolve(store.dispatch("document/setFileName", fileName));
  });

  it("File name should be visible", () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    expect(wrapper.findComponent(".file-name-section").text()).toBe(
      require("../mock/document_data.json").data_file_name
    );
  });

  it("Edit button should be visible when rendering the component", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    const button = wrapper.find(".btn");
    expect(button.text()).toBe("Edit");
  });

  it("The visible button should be the Save button after clicking on the Edit button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    const button = wrapper.findComponent(".btn");
    await button.trigger("click");
    expect(button.text()).toBe("Save");
  });

  it("No buttons should be visible while saving", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.findComponent(".edit-btn").trigger("click");
    expect(wrapper.findComponent(".edit-btn").exists()).toBe(false);

    await wrapper.findComponent(".save-btn").trigger("click");
    expect(wrapper.findComponent(".save-btn").exists()).toBe(false);
  });

  it("The file name should become a content editable when clicking on the Edit button and the file extension should not be visible", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.findComponent(".edit-btn").trigger("click");
    const contentEditable = wrapper.findComponent(".document-name");
    expect(wrapper.findComponent(".file-extension").exists()).toBe(false);
    expect(contentEditable.attributes("contenteditable")).toBe("true");
  });

  it("The file name should not be content editable after clicking the Save button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.findComponent(".edit-btn").trigger("click");
    const contentEditable = wrapper.findComponent(".document-name");
    await wrapper.findComponent(".save-btn").trigger("click");
    expect(contentEditable.attributes("contenteditable")).toBe("false");
  });

  it("Clicking on the save button should show the autosaving message to the user", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    await wrapper.findComponent(".edit-btn").trigger("click");
    await wrapper.findComponent(".save-btn").trigger("click");
    expect(wrapper.findComponent(".loading-container").exists()).toBe(true);
  });

  it("Check if save function is called after clicking save button", async () => {
    const wrapper = mount(DocumentTopBar, {
      store,
      mocks: { $t },
    });

    const mockFn = jest.fn().mockName("saveFunction");

    await wrapper.findComponent(".edit-btn").trigger("click");
    await wrapper.findComponent(".save-btn").trigger("click");
    await mockFn();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
