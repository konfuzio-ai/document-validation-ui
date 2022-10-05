import { mount } from "@vue/test-utils";
import {
  DocumentAnnotations,
  Label,
  EmptyAnnotation,
  Annotation,
  RejectedLabels,
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
      store.dispatch("document/setImageLoaded", true),
    ]);
  });

  it("sidebar has group of label sets", () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(wrapper.findAll(".labelset-group").length).toBeGreaterThan(0);
  });

  it("label set name appears", () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });
    expect(wrapper.findAll(".label-set-name").at(2).text()).toContain(
      store.state.document.annotationSets[1].label_set.name
    );
  });

  it("label name appears", () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(Label, {
      store,
      mocks: {
        $t,
      },
      propsData: {
        annotationSet,
        label,
      },
    });
    expect(wrapper.find(".label-property-text").text()).toContain(label.name);
  });

  it("check if label info appears when hovering", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });
    const element = wrapper.findAll(".label-property-left .b-tooltip").at(0);
    await element.find(".tooltip-trigger").trigger("mouseenter");
    requestAnimationFrame(() => {
      expect(element.find(".tooltip-content").isVisible()).toBe(true);
    });
  });

  it("Click should trigger edit mode in empty annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        label,
        annotationSet,
      },
      mocks: {
        $t,
      },
    });

    await wrapper.findComponent(".annotation-value").trigger("click");
    expect(store.state.selection.selectionEnabled).toEqual(
      `${annotationSet.id}_${label.id}`
    );
  });

  it("Action buttons should appear when bbox is created in empty annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(EmptyAnnotation, {
      store,
      propsData: {
        label,
        annotationSet,
      },
      mocks: {
        $t,
      },
    });

    const sampleBbox = {
      bottom: 141.3504,
      page_index: 0,
      top: 134.0496,
      x0: 99.7704,
      x1: 120.69359999999999,
      y0: 694.6487999999999,
      y1: 701.9496,
      start_offset: 439,
      end_offset: 444,
      line_number: 9,
      offset_string: "mit 1",
      offset_string_original: "mit 1",
    };

    await wrapper.findComponent(".annotation-value").trigger("click");
    await store.dispatch("selection/setSpanSelection", sampleBbox);
    expect(wrapper.findAll(".action-buttons").length).toEqual(1);
  });

  it("Only show 'accept' button on hover on filled annotations", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];
    const spanIndex = 0;
    const span = annotation.span[spanIndex];

    const wrapper = mount(Annotation, {
      store,
      propsData: {
        annotation,
        label,
        annotationSet,
        span,
        spanIndex,
      },
      data() {
        return {
          showAcceptButton: false,
        };
      },
      mocks: {
        $t,
      },
    });

    await wrapper.findComponent(".annotation-value").trigger("mouseover");
    await wrapper.setData({ showAcceptButton: true });

    expect(
      await wrapper
        .find(".buttons-container .action-buttons .annotation-accept-btn")
        .isVisible()
    ).toBe(true);

    await wrapper.findComponent(".annotation-value").trigger("mouseout");
    await wrapper.setData({ showAcceptButton: false });

    expect(
      await wrapper
        .find(".buttons-container .action-buttons .annotation-accept-btn")
        .exists()
    ).toBe(false);
  });

  it("Should only show the Rejected title when there are rejected labels", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const handleReject = jest.fn().mockName("rejectAnnotation");

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const wrapper2 = mount(EmptyAnnotation, {
      store,
      mocks: {
        $t,
      },
      data() {
        return {
          showReject: false,
        };
      },
      props: {
        label,
        annotationSet,
        handleReject,
      },
    });

    const rejectedAnnotation = [
      {
        label_set: require("../mock/document.json").annotation_sets[0].label_set
          .id,
        label: require("../mock/document.json").annotation_sets[0].labels[0].id,
      },
    ];

    expect(wrapper.findAll(".rejected-labels-list").exists()).toBe(false);

    await wrapper.findComponent(".empty-annotation").trigger("mouseenter");

    await wrapper2.setData({ showReject: true });

    await wrapper2
      .findComponent(".action-buttons .reject-button-container .reject-btn")
      .trigger("click");

    await store.dispatch("document/setMissingAnnotations", rejectedAnnotation);

    expect(store.state.document.missingAnnotations.length).toEqual(1);

    expect(wrapper.findComponent(".rejected-labels-list").exists()).toBe(true);

    expect(
      wrapper
        .findAll(".rejected-labels-list .rejected-label-container .title")
        .isVisible()
    ).toBe(true);

    await wrapper
      .findAll(
        ".rejected-labels-list .rejected-label-container .tags .is-delete"
      )
      .trigger("click");

    await store.dispatch("document/setMissingAnnotations", []);

    expect(wrapper.findAll(".rejected-labels-list").exists()).toBe(false);
  });

  it("Rejecting should remove item from the label list, and it should show under Rejected", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const rejectedAnnotation = [
      {
        label_set: require("../mock/document.json").annotation_sets[0].label_set
          .id,
        label: require("../mock/document.json").annotation_sets[0].labels[0].id,
      },
    ];

    await store.dispatch("document/setMissingAnnotations", rejectedAnnotation);

    expect(
      wrapper
        .findAll(".label-properties .label-property-name .label-property-text")
        .at(0)
        .text()
    ).not.toBe(
      require("../mock/document.json").annotation_sets[0].labels[0].name
    );

    expect(
      await wrapper.findAll(
        ".rejected-labels-list .rejected-label-container .rejected-tag-container .tags .tags"
      ).length
    ).toBe(1);
  });

  it("Clicking the X button should remove the label from rejected and back to the labels list", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const rejectedAnnotation = [
      {
        label_set: require("../mock/document.json").annotation_sets[0].label_set
          .id,
        label: require("../mock/document.json").annotation_sets[0].labels[0].id,
      },
    ];

    await store.dispatch("document/setMissingAnnotations", rejectedAnnotation);

    await wrapper
      .findAll(
        ".rejected-labels-list .rejected-label-container .tags .is-delete"
      )
      .trigger("click");

    await store.dispatch("document/setMissingAnnotations", []);

    expect(
      wrapper
        .findAll(".label-properties .label-property-name .label-property-text")
        .at(0)
        .text()
    ).toBe("Anrede");
  });
});
