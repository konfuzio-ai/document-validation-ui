import {
  mount
} from "@vue/test-utils";
import {
  DocumentAnnotations,
  Label,
  EmptyAnnotation
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
  it("sidebar has group of label sets", () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t
      },
    });
    expect(wrapper.findAll(".labelset-group").length).toBeGreaterThan(0);
  });

  it("label set name appears", () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t
      },
    });
    expect(wrapper.findAll(".label-set-name").at(2).text()).toContain(store.state.document.annotationSets[1].label_set.name);
  });

  it("label name appears", () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(Label, {
      store,
      mocks: {
        $t
      },
      propsData: {
        annotationSet,
        label
      }
    });
    expect(wrapper.find(".label-property-text").text()).toContain(label.name);
  });

  it("check if label info appears when hovering", async () => {
    const wrapper = mount(DocumentAnnotations, {
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

  it("Action Buttons should start hidden in empty annotation", () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        label,
        annotationSet
      },
      mocks: {
        $t
      },
    });

    expect(wrapper.findAll(".action-buttons").length).toEqual(0);
  });

  it("Click should trigger edit mode in empty annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        label,
        annotationSet
      },
      mocks: {
        $t
      },
    });

    await wrapper.findComponent(".label-property-value").trigger("click");
    expect(store.state.selection.selectionEnabled).toEqual(`${annotationSet.id}_${label.id}`);
  });

  it("Action buttons should appear when bbox is created in empty annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        label,
        annotationSet
      },
      mocks: {
        $t
      },
    });

    const sampleBbox = {
      "bottom": 141.3504,
      "page_index": 0,
      "top": 134.0496,
      "x0": 99.7704,
      "x1": 120.69359999999999,
      "y0": 694.6487999999999,
      "y1": 701.9496,
      "start_offset": 439,
      "end_offset": 444,
      "line_number": 9,
      "offset_string": "mit 1",
      "offset_string_original": "mit 1"
    }

    await wrapper.findComponent(".label-property-value").trigger("click");
    await store.dispatch("selection/setSpanSelection", sampleBbox)
    expect(wrapper.findAll(".action-buttons").length).toEqual(1);
  });
});