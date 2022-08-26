import { shallowMount, mount } from "@vue/test-utils";
import { DocumentEdit, EditPages } from "../../src/components/DocumentEdit";
import {
  DocumentTopBar,
  DocumentTopBarButtons,
} from "../../src/components/DocumentTopBar";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Edit Component", () => {
  beforeEach(() => {
    Promise.all([
      store.dispatch("document/setPages", [
        require("../mock/page_1.json"),
        require("../mock/page_2.json"),
      ]),
      store.dispatch("edit/setEditMode", true),
      store.dispatch("edit/setPagesArray", store.state.document.pages),
    ]);
  });

  // it("check number of thumbnails", async () => {
  //   const wrapper = shallowMount(EditPages, {
  //     store,
  //     mocks: {
  //       $t,
  //     },
  //   });

  //   expect(
  //     wrapper.findAll(".edit-pages .document-grid .image-section").length
  //   ).toEqual(2);
  // });

  it("Clicking the cancel button should close edit view", async () => {
    const wrapper = shallowMount(DocumentTopBar, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper
      .findAllComponents(
        ".edit-mode-buttons .buttons .button-cancel.is-default"
      )
      .trigger("click");

    expect(store.state.edit.editMode).toBe(false);
  });

  // it("The text of the right button should change if pages were split", async () => {
  //   const wrapper = mount(DocumentEdit, {
  //     store,
  //     mocks: {
  //       $t,
  //     },
  //   });

  //   await wrapper
  //     .findAll(".edit-pages .document-grid .image-section .splitting-lines")
  //     .trigger("click");
  //   expect(store.state.edit.updatedDocument.length).toBe(2);
  // });
});
