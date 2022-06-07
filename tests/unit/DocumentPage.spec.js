import { mount } from "@vue/test-utils";
import {
  ScrollingDocument,
  ScrollingPage,
  Toolbar,
} from "../../src/components/DocumentPage";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Page Component", () => {
  beforeEach(() => {
    Promise.all([
      store.dispatch(
        "document/setAnnotations",
        store.getters["document/annotations"](
          require("../mock/document.json").annotation_sets
        )
      ),
      store.dispatch("document/setPages", [
        require("../mock/page_1.json"),
        require("../mock/page_2.json"),
      ]),
    ]);
  });
  it("document contains two scrolling pages", async () => {
    const wrapper = mount(ScrollingDocument, {
      store,
      propsData: {
        pages: store.state.document.pages,
      },
      mocks: { $t },
    });
    expect(wrapper.findAllComponents(ScrollingPage).length).toBe(2);
  });
  it("document should have page 1 visible", async () => {
    mount(ScrollingDocument, {
      store,
      propsData: {
        pages: store.state.document.pages,
      },
      mocks: { $t },
    });

    expect(store.getters["display/visiblePageRange"]).toContain(1);
  });

  it("toolbar should be visible", async () => {
    const wrapper = mount(ScrollingDocument, {
      store,
      mocks: { $t },
    });

    const toolbar = await wrapper.findComponent(".toolbar-container");
    expect(toolbar.exists()).toBe(true);
  });
});
