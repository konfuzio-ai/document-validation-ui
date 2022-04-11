import { shallowMount } from "@vue/test-utils";
import { DocumentThumbnails } from "@/components/DocumentThumbnails";
import store from "@/store";

describe("Document Thumbnails Component", () => {
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
  it("check number of thumbnails", () => {
    const wrapper = shallowMount(DocumentThumbnails, {
      store,
    });
    expect(wrapper.findAll(".document-thumbnail").length).toEqual(2);
  });

  it("check if first thumbnail is selected", async () => {
    const wrapper = shallowMount(DocumentThumbnails, {
      store,
    });
    expect(wrapper.findAll(".img-thumbnail").at(0).classes()).toContain(
      "selected"
    );
  });

  it("check if second thumbnail is not selected", async () => {
    const wrapper = shallowMount(DocumentThumbnails, {
      store,
    });
    expect(wrapper.findAll(".img-thumbnail").at(1).classes()).not.toContain(
      "selected"
    );
  });

  it("check if second thumbnail has text 2", async () => {
    const wrapper = shallowMount(DocumentThumbnails, {
      store,
    });
    expect(wrapper.findAll(".number-thumbnail").at(1).text()).toBe("2");
  });
});
