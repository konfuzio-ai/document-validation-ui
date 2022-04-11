import { mount } from "@vue/test-utils";
import {
  DocumentLabelSets,
  DocumentLabels,
} from "@/components/DocumentAnnotations";
import store from "@/store";

describe("Document Annotations Component", () => {
  beforeEach(() => {
    Promise.all([
      store.dispatch(
        "sidebar/setAnnotationSets",
        require("../mock/document.json").annotation_sets
      ),
    ]);
  });
  it("sidebar has tabs for label sets", () => {
    const wrapper = mount(DocumentLabelSets, {
      store,
    });
    expect(wrapper.findAll(".label-tab").length).toBeGreaterThan(0);
  });

  it("sidebar has first tab active", async () => {
    const wrapper = mount(DocumentLabelSets, {
      store,
    });
    await store.dispatch(
      "sidebar/setActiveAnnotationSet",
      store.state.sidebar.annotationSets[0]
    );
    expect(wrapper.findAll(".label-tab").at(0).classes()).toContain(
      "is-active"
    );
  });

  it("sidebar has label list from the second label set", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
    });

    const annotationSet = store.state.sidebar.annotationSets[1];

    await store.dispatch("sidebar/setActiveAnnotationSet", annotationSet);

    expect(wrapper.findAll(".label-properties").length).toBe(
      store.getters["sidebar/totalAnnotationsInAnnotationSet"](annotationSet)
    );
  });

  it("check if description is hidden when no click on label", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
    });

    const annotationSet = store.state.sidebar.annotationSets[0];

    await store.dispatch("sidebar/setActiveAnnotationSet", annotationSet);
    expect(
      wrapper.findAll(".label-property-description").at(0).classes()
    ).not.toContain("open");
  });

  it("check if description appears when clicking a label", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
    });

    const annotationSet = store.state.sidebar.annotationSets[0];

    await store.dispatch("sidebar/setActiveAnnotationSet", annotationSet);
    await wrapper.findAll(".label-property-top").at(0).trigger("click");
    expect(
      wrapper.findAll(".label-property-description").at(0).classes()
    ).toContain("open");
  });
});
