import { render } from "../utils/render";
import { dispatch, getData } from "../utils/store";
import {
  DocumentEdit,
  EditPages,
  EditSidebar,
  RenameAndCategorize,
} from "../../src/components/DocumentEdit";
import { DocumentTopBarButtons } from "../../src/components/DocumentTopBar";

describe("Document Edit Component", () => {
  beforeEach(async () => {
    await dispatch("edit/enableEditMode");
    await dispatch("edit/setPagesForPostprocess", getData("document").pages);
  });

  it("check number of thumbnails", async () => {
    const wrapper = render(
      EditPages,
      false,
      {},
      {
        editPages: getData("edit").pagesForPostprocess,
      }
    );

    expect(
      await wrapper.findAll(".edit-pages .document-grid .image-section").length
    ).toEqual(2);
  });

  it("the sidebar should be visible", async () => {
    const wrapper = render(DocumentEdit, false);

    expect(
      await wrapper.findAllComponents(".sidebar .edit-sidebar").isVisible()
    ).toBe(true);
  });

  it("The sidebar has 4 buttons", async () => {
    const wrapper = render(EditSidebar, false);

    expect(
      await wrapper.findAll(".buttons-container .sidebar-buttons").length
    ).toBe(4);
  });

  it("Clicking the cancel button should close edit view", async () => {
    const wrapper = render(DocumentTopBarButtons, false);

    await wrapper.find(".buttons .button-cancel").trigger("click");

    expect(await getData("edit").editMode).toBe(false);
  });

  it("Clicking on thumbnail should select it", async () => {
    const wrapper = render(
      EditPages,
      false,
      {},
      {
        editPages: getData("edit").pagesForPostprocess,
      }
    );

    await wrapper
      .findAll(
        ".document-grid .image-section .edit-page-thumbnail .page-thumbnail"
      )
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
    const wrapper = render(
      EditPages,
      false,
      {},
      {
        editPages: getData("edit").pagesForPostprocess,
      }
    );

    const wrapper2 = render(
      EditSidebar,
      false,
      {},
      {
        buttonDisabled: true,
      }
    );

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
    const wrapper = render(
      EditPages,
      false,
      {},
      {
        editPages: getData("edit").pagesForPostprocess,
      }
    );

    const subDocumentMock = [
      {
        name: getData("document").selectedDocument.name,
        category: getData("document").selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name: getData("document").selectedDocument.name,
        category: getData("document").selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    const mockFn = jest.fn().mockName("handleSplittingLines");

    await wrapper.find(".image-section .splitting-lines").trigger("click");

    await mockFn(require("../mock/page_1.json").number);

    await dispatch("edit/setUpdatedDocument", subDocumentMock);

    expect(await getData("edit").updatedDocument.length).toBe(2);
  });

  it("If document was split, go to Rename and Categorize", async () => {
    const wrapper = render(
      EditPages,
      false,
      {},
      {
        editPages: getData("edit").pagesForPostprocess,
      }
    );

    const subDocumentMock = [
      {
        name: getData("document").selectedDocument.name,
        category: getData("document").selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name: getData("document").selectedDocument.name,
        category: getData("document").selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    const mockFn = jest.fn().mockName("handleSplittingLines");

    await wrapper.find(".image-section .splitting-lines").trigger("click");

    await mockFn(require("../mock/page_1.json").number);

    await dispatch("edit/setUpdatedDocument", subDocumentMock);

    const wrapper2 = render(DocumentTopBarButtons, false);

    await wrapper2.find(".buttons .button-next").trigger("click");

    expect(getData("edit").renameAndCategorize).toBe(true);
  });

  it("Number of rows based on number of split docs", async () => {
    const wrapper = render(RenameAndCategorize, false);

    await dispatch("edit/setRenameAndCategorize", true);

    const subDocumentMock = [
      {
        name: await getData("document").selectedDocument.name,
        category: await getData("document").selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name: await getData("document").selectedDocument.name,
        category: await getData("document").selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    await dispatch("edit/setUpdatedDocument", subDocumentMock);

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
    const wrapper = render(RenameAndCategorize, false);

    await dispatch("edit/setRenameAndCategorize", true);

    const subDocumentMock = [
      {
        name: await getData("document").selectedDocument.data_file_name,
        category: await getData("document").selectedDocument.category,
        pages: [require("../mock/page_1.json")],
      },
      {
        name:
          require("../mock/document.json").data_file_name.split(".")[0] +
          "_copy",
        category: await getData("document").selectedDocument.category,
        pages: [require("../mock/page_2.json")],
      },
    ];

    await dispatch("edit/setUpdatedDocument", subDocumentMock);

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
    const wrapper = render(DocumentEdit, false);

    const wrapper2 = render(DocumentTopBarButtons, false);

    await wrapper2.find(".buttons .is-primary").trigger("click");

    expect(
      await wrapper
        .find(".confirmation-modal-container .edit-confirmation-modal")
        .isVisible()
    ).toBe(true);
  });

  it("Smart Split is visible & switch is disabled if no splitting suggestions", async () => {
    const wrapper = render(EditSidebar, false);

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

    const wrapper = render(EditSidebar, false);

    const wrapper2 = render(DocumentEdit, false);

    await dispatch("document/setSplittingSuggestions", suggestions);
    await dispatch("edit/setRenameAndCategorize", false);

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

    const wrapper = render(
      DocumentEdit,
      false,
      {},
      {
        splitSuggestionsEnabled: false,
        splittingLines: [],
      }
    );

    await dispatch("edit/setRenameAndCategorize", false);

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
