import { mount, shallowMount } from "@vue/test-utils";
import {
  ScrollingDocument,
  ScrollingPage,
  ToolBar,
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

  it("Toolbar should be visible", async () => {
    const wrapper = shallowMount(ToolBar, {
      store,
      mocks: { $t },
    });

    expect(wrapper.findComponent(".toolbar-container"));
  });

  it("Toolbar should have icons visible", async () => {
    const wrapper = shallowMount(ToolBar, {
      store,
      mocks: { $t },
    });

    expect(wrapper.findComponent(".edit-icon").exists()).toBe(true);
    expect(wrapper.findComponent(".split-icon").exists()).toBe(true);
    expect(wrapper.findComponent(".rotate-icon").exists()).toBe(true);
    expect(wrapper.findComponent(".fit-zoom").exists()).toBe(true);
    expect(wrapper.findComponent(".zoom-in").exists()).toBe(true);
    expect(wrapper.findComponent(".zoom-out").exists()).toBe(true);
  });
});
