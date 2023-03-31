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
  const annotations = [];
  require("../mock/document.json").annotation_sets.map((annotationSet) => {
    annotationSet.labels.map((label) => {
      annotations.push(...label.annotations);
    });
  });

  // mock scale for scrolling pages
  const scale = {
    elementsWidth: 1,
    client: {
      width: 1600,
      height: 1200,
    },
    viewport: {
      width: require("../mock/page_1.json").size[0],
      height: require("../mock/page_1.json").size[1],
    },
  };

  beforeEach(() => {
    Promise.all([
      store.dispatch(
        "document/setSelectedDocument",
        require("../mock/document.json")
      ),
      store.dispatch("document/setAnnotations", annotations),
      store.dispatch("document/setPages", [
        require("../mock/page_1.json"),
        require("../mock/page_2.json"),
      ]),
      store.dispatch("document/endRecalculatingAnnotations"),
      store.dispatch("document/endLoading"),
      store.dispatch("display/updateScale", scale),
      store.dispatch("document/setPublicView", false),
    ]);
  });

  it("document contains two scrolling pages", async () => {
    const wrapper = shallowMount(ScrollingDocument, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.findAll(".scrolling-page").length).toBe(2);
  });

  it("document should have page 1 visible", async () => {
    mount(ScrollingDocument, {
      store,
      propsData: {
        pages: store.state.document.pages,
      },
      mocks: {
        $t,
      },
    });

    expect(store.getters["display/visiblePageRange"]).toContain(1);
  });

  it("Toolbar should be visible", async () => {
    const wrapper = shallowMount(ToolBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.findComponent(".toolbar-container"));
  });

  it("Toolbar should have icons and text visible", async () => {
    const wrapper = shallowMount(ToolBar, {
      store,
      mocks: {
        $t,
      },
    });

    expect(await wrapper.findComponent(".edit-icon").exists()).toBe(true);
    expect(await wrapper.findComponent(".edit-text").exists()).toBe(true);
    expect(await wrapper.findComponent(".fit-zoom").exists()).toBe(true);
    expect(await wrapper.findComponent(".zoom-in").exists()).toBe(true);
    expect(await wrapper.findComponent(".zoom-out").exists()).toBe(true);
  });
});
