import {
  mount
} from "@vue/test-utils";
import {
  EmptyAnnotation
} from "../../src/components/DocumentAnnotations";
import store from "../../src/store";

// mock i18n so we don't need to load the library
const $t = () => {};

const annotation = require("../mock/empty_annotation.json").annotation;
const annotationSet = require("../mock/empty_annotation.json").annotationSet;

describe("Empty Annotation", () => {

  it("Action Buttons should start hidden", () => {
    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        annotation,
        annotationSet
      },
      mocks: {
        $t
      },
    });

    expect(wrapper.findAll(".action-buttons").length).toEqual(0);
  });

  it("Click should trigger edit mode", async () => {
    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        annotation,
        annotationSet
      },
      mocks: {
        $t
      },
    });

    await wrapper.findComponent(".label-property-value").trigger("click");
    expect(store.state.selection.selectionEnabled).toEqual(`${annotationSet.id}_${annotation.label_id}`);
  });

  it("Action buttons should appear when bbox is created", async () => {
    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        annotation,
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