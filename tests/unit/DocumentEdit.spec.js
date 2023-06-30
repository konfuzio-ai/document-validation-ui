import { shallowMount, mount } from "@vue/test-utils";
import {
  DocumentEdit,
  EditPages,
  EditSidebar,
  RenameAndCategorize,
} from "../../src/components/DocumentEdit";
import { DocumentTopBarButtons } from "../../src/components/DocumentTopBar";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Edit Component", () => {
  beforeEach(() => {
    const pages = [
      require("../mock/page_1.json"),
      require("../mock/page_2.json"),
    ];

    const selectedDocument = require("../mock/document.json");
    selectedDocument.pages = pages;
    Promise.all([
      store.dispatch("document/setSelectedDocument", selectedDocument),
      store.dispatch("document/setPages", pages),
      store.dispatch("edit/setPagesForPostprocess", pages),
      store.dispatch("edit/enableEditMode"),
      store.dispatch("document/endRecalculatingAnnotations"),
      store.dispatch("document/endLoading"),
    ]);
  });

  it("check number of thumbnails", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.pagesForPostprocess,
        };
      },
    });

    expect(
      await wrapper.findAll(".edit-pages .document-grid .image-section").length
    ).toEqual(2);
  });

  it("the sidebar should be visible", async () => {
    const wrapper = mount(DocumentEdit, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper.findAllComponents(".sidebar .edit-sidebar").isVisible()
    ).toBe(true);
  });

  it("The sidebar has 4 buttons", async () => {
    const wrapper = mount(EditSidebar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper.findAll(".buttons-container .sidebar-buttons").length
    ).toBe(4);
  });

  it("Clicking the cancel button should close edit view", async () => {
    const wrapper = mount(DocumentTopBarButtons, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.find(".buttons .button-cancel").trigger("click");

    expect(await store.state.edit.editMode).toBe(false);
  });

  it("Clicking on thumbnail should select it", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.pagesForPostprocess,
        };
      },
    });

    await wrapper
      .findAll(".image-section .edit-page-thumbnail .page-thumbnail")
      .at(0)
      .trigger("click");

    expect(
      await wrapper
        .find(
          ".document-grid .image-section .edit-page-thumbnail .page-thumbnail.selected"
        )
        .exists()
    ).toBe(true);
  });

  it("Single page rotation buttons should be enabled when page is selected ", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.pagesForPostprocess,
        };
      },
    });

    const wrapper2 = mount(EditSidebar, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          buttonDisabled: true,
        };
      },
    });

    await wrapper
      .findAll(".image-section .edit-page-thumbnail .page-thumbnail")
      .at(0)
      .trigger("click");

    await wrapper2.setData({
      buttonDisabled: false,
    });

    expect(await wrapper2.vm.buttonDisabled).toBe(false);
    expect(
      await wrapper2
        .findAll(".buttons-container .rotate-selected .rotate-button")
        .at(0)
        .attributes("disabled")
    ).toBeUndefined;
  });

  it("Number of subdocuments when splitting", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.pagesForPostprocess,
        };
      },
    });

    const subDocumentMock = [
      {
        name: store.state.document.selectedDocument.name,
        category: store.state.document.selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name: store.state.document.selectedDocument.name,
        category: store.state.document.selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    const mockFn = jest.fn().mockName("handleSplittingLines");

    await wrapper.find(".image-section .splitting-lines").trigger("click");

    await mockFn(require("../mock/page_1.json").number);

    await store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    expect(await store.state.edit.updatedDocument.length).toBe(2);
  });

  it("If document was split, go to Rename and Categorize", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.pagesForPostprocess,
        };
      },
    });

    const subDocumentMock = [
      {
        name: store.state.document.selectedDocument.name,
        category: store.state.document.selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name: store.state.document.selectedDocument.name,
        category: store.state.document.selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    const mockFn = jest.fn().mockName("handleSplittingLines");

    await wrapper.find(".image-section .splitting-lines").trigger("click");

    await mockFn(require("../mock/page_1.json").number);

    await store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    const wrapper2 = mount(DocumentTopBarButtons, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper2.find(".buttons .button-next").trigger("click");

    expect(store.state.edit.renameAndCategorize).toBe(true);
  });

  it("Number of rows based on number of split docs", async () => {
    const wrapper = mount(RenameAndCategorize, {
      store,
      mocks: {
        $t,
      },
    });

    await store.dispatch("edit/setRenameAndCategorize", true);

    const subDocumentMock = [
      {
        name: await store.state.document.selectedDocument.name,
        category: await store.state.document.selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name: await store.state.document.selectedDocument.name,
        category: await store.state.document.selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    await store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    expect(
      await wrapper.findAll(
        ".document-details .rename-and-categorize-thumbnails"
      ).length
    ).toBe(2);
    expect(
      await wrapper.findAll(".document-details .file-name-section").length
    ).toBe(2);
    expect(await wrapper.findAll(".document-details .category").length).toBe(2);
  });

  it("First subdocument should have original file name", async () => {
    const wrapper = mount(RenameAndCategorize, {
      store,
      mocks: {
        $t,
      },
    });

    await store.dispatch("edit/setRenameAndCategorize", true);

    const subDocumentMock = [
      {
        name: await store.state.document.selectedDocument.data_file_name,
        category: await store.state.document.selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name:
          require("../mock/document.json").data_file_name.split(".")[0] +
          "_copy",
        category: await store.state.document.selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    await store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    const mockFn = jest.fn().mockName("getFileName");

    await mockFn(subDocumentMock[0].name);
    await mockFn(subDocumentMock[1].name);

    expect(
      await wrapper
        .findAll(".document-details .doc-info .file-name-section .name-input")
        .at(0).element.value
    ).toBe("3AVAWS");
  });

  it("Confirmation modal is shown when trying to submit changes", async () => {
    const wrapper = mount(DocumentEdit, {
      store,
      mocks: {
        $t,
      },
    });

    const wrapper2 = mount(DocumentTopBarButtons, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper2.find(".buttons .is-primary").trigger("click");

    expect(
      await wrapper
        .find(".confirmation-modal-container .edit-confirmation-modal")
        .isVisible()
    ).toBe(true);
  });

  it("Smart Split is visible & switch is disabled if no splitting suggestions", async () => {
    const wrapper = mount(EditSidebar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.find(".smart-split .b-tooltip").isVisible()).toBe(
      true
    );

    expect(
      await wrapper
        .find(".smart-split .b-tooltip .tooltip-trigger .switch")
        .attributes("disabled")
    ).toBe("disabled");
  });

  it("Smart Split is enabled if splitting suggestions & info bar appears", async () => {
    const suggestions = [
      {
        name: require("../mock/document.json").data_file_name,
        category: require("../mock/document.json").category,
        pages: [require("../mock/document.json").pages[1]],
      },
      {
        name: require("../mock/document.json").data_file_name,
        category: require("../mock/document.json").category,
        pages: [require("../mock/document.json").pages[1]],
      },
    ];

    const wrapper = mount(EditSidebar, {
      store,
      mocks: {
        $t,
      },
    });

    const wrapper2 = mount(DocumentEdit, {
      store,
      mocks: {
        $t,
      },
    });

    await store.dispatch("document/setSplittingSuggestions", suggestions);
    await store.dispatch("edit/setRenameAndCategorize", false);

    expect(
      await wrapper
        .find(".smart-split .b-tooltip .tooltip-trigger .switch")
        .attributes("disabled")
    ).toBeUndefined;

    await wrapper2.setData({
      splitSuggestionsEnabled: true,
    });

    expect(
      await wrapper2
        .find(".pages-section .info-bar .split-info-bar")
        .isVisible()
    ).toBe(true);
  });

  it("Smart Split toggles between adding the suggestions and removing them", async () => {
    const lines = [
      { page: 1, origin: "AI" },
      { page: 2, origin: null },
    ];

    const wrapper = mount(DocumentEdit, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          splitSuggestionsEnabled: false,
          splittingLines: [],
        };
      },
    });

    await store.dispatch("edit/setRenameAndCategorize", false);

    await wrapper.setData({
      splittingLines: [
        { page: 0, origin: "AI" },
        { page: 0, origin: null },
      ],
    });

    expect(await wrapper.find(".image-section .active-split").exists()).toBe(
      false
    );

    await wrapper.setData({
      splitSuggestionsEnabled: true,
      splittingLines: lines,
    });

    expect(await wrapper.find(".image-section .active-split").exists()).toBe(
      true
    );
  });
});
