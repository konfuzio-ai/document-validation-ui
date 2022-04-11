import { mount } from "@vue/test-utils";
import { ScrollingDocument, ScrollingPage } from "@/components/DocumentPage";
import store from "@/store";

describe("Document Page Component", () => {
  beforeEach(() => {
    Promise.all([
      store.dispatch(
        "document/setAnnotations",
        store.getters["document/annotationsInAnnotationSets"](
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
    });
    expect(wrapper.findAllComponents(ScrollingPage).length).toBe(2);
  });
  it("document should have page 1 visible", async () => {
    mount(ScrollingDocument, {
      store,
      propsData: {
        pages: store.state.document.pages,
      },
    });

    expect(store.getters["display/visiblePageRange"]).toContain(1);
  });
});
