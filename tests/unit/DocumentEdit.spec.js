import { shallowMount, mount } from "@vue/test-utils";
import {
  DocumentEdit,
  EditPages,
  EditSidebar,
  SplitOverview,
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

    const selectedDocument = require("../mock/document_data.json");
    selectedDocument.pages = pages;
    Promise.all([
      store.dispatch("document/setSelectedDocument", selectedDocument),
      store.dispatch("document/setPages", pages),
      store.dispatch("edit/setDocumentPagesListForEditMode", pages),
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
          editPages: store.state.edit.documentPagesListForEditMode,
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

  it("Clicking the cancel button should close edit view", async () => {
    const wrapper = mount(DocumentTopBarButtons, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper.find(".buttons .button-cancel").trigger("click");

    expect(store.state.edit.editMode).toBe(false);
  });

  it("Clicking on thumbnail should select it", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.documentPagesListForEditMode,
        };
      },
    });

    await wrapper
      .findAll(".image-section .image-container .thumbnail")
      .at(0)
      .trigger("click");

    expect(
      wrapper
        .find(
          ".document-grid .image-section .image-container .thumbnail .selected"
        )
        .exists()
    ).toBe(true);
  });

  it("Eye icon should be visible on hovering thumbnail", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.documentPagesListForEditMode,
        };
      },
    });

    await wrapper
      .findAll(".image-section .image-container .thumbnail")
      .at(0)
      .trigger("hover");

    expect(
      await wrapper.find(".thumbnail .icon-container .action-icon").exists()
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
          editPages: store.state.edit.documentPagesListForEditMode,
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
      .findAll(".image-section .image-container .thumbnail")
      .at(0)
      .trigger("click");

    await wrapper2.setData({
      buttonDisabled: false,
    });

    expect(wrapper2.vm.buttonDisabled).toBe(false);
    expect(
      wrapper2
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
          editPages: store.state.edit.documentPagesListForEditMode,
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

    expect(store.state.edit.updatedDocument.length).toBe(2);
  });

  it("If document was split, go to overview", async () => {
    const wrapper = mount(EditPages, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          editPages: store.state.edit.documentPagesListForEditMode,
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

    store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    const wrapper2 = mount(DocumentTopBarButtons, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper2.find(".buttons .button-next").trigger("click");

    expect(store.state.edit.splitOverview).toBe(true);
  });

  it("Number of rows based on number of split docs", async () => {
    const wrapper = mount(SplitOverview, {
      store,
      mocks: {
        $t,
      },
    });

    store.dispatch("edit/setSplitOverview", true);

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

    await store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    expect(
      await wrapper.findAll(".document-details .overview-thumbnails").length
    ).toBe(2);
    expect(
      await wrapper.findAll(".document-details .file-name-section").length
    ).toBe(2);
    expect(await wrapper.findAll(".document-details .category").length).toBe(2);
  });

  it("First subdocument should have original file name", async () => {
    const wrapper = mount(SplitOverview, {
      store,
      mocks: {
        $t,
      },
    });

    await store.dispatch("edit/setSplitOverview", true);

    const subDocumentMock = [
      {
        name: store.state.document.selectedDocument.data_file_name,
        category: store.state.document.selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name:
          require("../mock/document_data.json").data_file_name.split(".")[0] +
          "_copy",
        category: store.state.document.selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    await store.dispatch("edit/setUpdatedDocument", subDocumentMock);

    const mockFn = jest.fn().mockName("getFileName");

    await mockFn(subDocumentMock[0].name);
    await mockFn(subDocumentMock[1].name);

    expect(
      wrapper
        .findAll(".document-details .doc-info .file-name-section .name-input")
        .at(0).element.value
    ).toBe("3AVAWS");
  });
});
