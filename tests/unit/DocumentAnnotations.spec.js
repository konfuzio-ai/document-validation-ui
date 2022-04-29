import { mount } from "@vue/test-utils";
import {
  DocumentLabelSets,
  DocumentLabels,
} from "@/components/DocumentAnnotations";
import store from "@/store";

// mock i18n so we don't need to load the library
const $t = () => {};

describe("Document Annotations Component", () => {
  beforeEach(() => {
    Promise.all([
      store.dispatch(
        "document/setAnnotationSets",
        require("../mock/document.json").annotation_sets
      ),
    ]);
  });
  it("sidebar has tabs for label sets", () => {
    const wrapper = mount(DocumentLabelSets, {
      store,
      mocks: { $t },
    });
    expect(wrapper.findAll(".label-tab").length).toBeGreaterThan(0);
  });

  it("sidebar has first tab active", async () => {
    const wrapper = mount(DocumentLabelSets, {
      store,
      mocks: { $t },
    });
    await store.dispatch(
      "document/setActiveAnnotationSet",
      store.state.document.annotationSets[0]
    );
    expect(wrapper.findAll(".label-tab").at(0).classes()).toContain(
      "is-active"
    );
  });

  it("sidebar has label list from the second label set", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
      mocks: { $t },
    });

    const annotationSet = store.state.document.annotationSets[1];

    await store.dispatch("document/setActiveAnnotationSet", annotationSet);

    expect(wrapper.findAll(".label-properties").length).toBe(
      store.getters["document/totalAnnotationsInAnnotationSet"](annotationSet)
    );
  });

  it("check if description is hidden when no click on label", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
      mocks: { $t },
    });

    const annotationSet = store.state.document.annotationSets[0];

    await store.dispatch("document/setActiveAnnotationSet", annotationSet);
    expect(
      wrapper.findAll(".label-property-description").at(0).classes()
    ).not.toContain("open");
  });

  it("check if description appears when clicking a label", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
      mocks: { $t },
    });

    const annotationSet = store.state.document.annotationSets[0];

    await store.dispatch("document/setActiveAnnotationSet", annotationSet);
    await wrapper.findAll(".label-property-top").at(0).trigger("click");
    expect(
      wrapper.findAll(".label-property-description").at(0).classes()
    ).toContain("open");
  });
});
