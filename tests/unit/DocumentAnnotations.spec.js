import {
  mount
} from "@vue/test-utils";
import {
  DocumentLabelSets,
  DocumentLabels,
} from "../../src/components/DocumentAnnotations";
import store from "../../src/store";

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
      mocks: {
        $t
      },
    });
    expect(wrapper.findAll(".label-tab").length).toBeGreaterThan(0);
  });

  it("sidebar has first tab active", async () => {
    const wrapper = mount(DocumentLabelSets, {
      store,
      mocks: {
        $t
      },
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
      mocks: {
        $t
      },
    });

    const annotationSet = store.state.document.annotationSets[1];

    await store.dispatch("document/setActiveAnnotationSet", annotationSet);

    expect(wrapper.findAll(".label-properties").length).toBe(
      store.getters["document/totalAnnotationsInAnnotationSet"](annotationSet)
    );
  });

  it("check if label info appears when hovering", async () => {
    const wrapper = mount(DocumentLabels, {
      store,
      mocks: {
        $t
      },
    });
    const element = wrapper.findAll(".label-property-left .b-tooltip").at(0);
    await element.find(".tooltip-trigger").trigger("mouseenter");
    requestAnimationFrame(() => {
      expect(
        element.find(".tooltip-content")
        .isVisible()).toBe(true);
    })
  });
});