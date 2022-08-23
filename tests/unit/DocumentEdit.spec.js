import { shallowMount, mount } from "@vue/test-utils";
import { DocumentEdit, SplitOverview } from "../../src/components/DocumentEdit";
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
      store.dispatch("edit/setEditMode", "rotate"),
    ]);
  });

  it("check number of thumbnails", () => {
    const wrapper = shallowMount(DocumentEdit, {
      store,
      mocks: {
        $t,
      },
    });
    expect(wrapper.findAll(".image-section").length).toEqual(2);
  });

  it("check if cancelling closes edit view", async () => {
    const wrapper = mount(DocumentEdit, {
      store,
      mocks: {
        $t,
      },
    });
    await wrapper
      .find(".edit-top-bar .buttons .button-cancel")
      .trigger("click");

    expect(store.state.edit.editMode).toBe(null);
  });
});
