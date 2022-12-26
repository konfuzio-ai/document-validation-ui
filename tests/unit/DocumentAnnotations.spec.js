import { mount } from "@vue/test-utils";
import {
  DocumentAnnotations,
  DocumentLabel,
  EmptyAnnotation,
  AnnotationContent,
  AnnotationRow,
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
      store.dispatch("document/setPublicView", false),
      store.dispatch("document/endRecalculatingAnnotations"),
      store.dispatch("document/endLoading"),
    ]);
  });

  it("sidebar has group of label sets", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper.findAll(".annotation-set-group").length
    ).toBeGreaterThan(0);
  });

  it("label set name appears", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });
    expect(await wrapper.findAll(".label-set-name").at(2).text()).toContain(
      store.state.document.annotationSets[1].label_set.name
    );
  });

  it("label name appears", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = mount(DocumentLabel, {
      store,
      mocks: {
        $t,
      },
      propsData: {
        annotationSet,
        label,
      },
    });
    expect(await wrapper.find(".annotation-row .label-name").text()).toContain(
      label.name
    );
  });

  it("check if annotation info appears when hovering", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });
    const element = wrapper
      .findAll(".annotation-row .annotation-details")
      .at(0);
    await element.find(".tooltip-trigger").trigger("mouseenter");
    requestAnimationFrame(() => {
      expect(element.find(".tooltip-content").isVisible()).toBe(true);
    });
  });

  it("Click should trigger edit mode in empty annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    let emptyAnnotationId;

    if (annotationSet.id) {
      emptyAnnotationId = `${annotationSet.id}_${label.id}`;
    } else {
      emptyAnnotationId = `${annotationSet.label_set.id}_${label.id}`;
    }

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
    expect(store.state.selection.selectionEnabled).toEqual(emptyAnnotationId);
  });

  it("Action buttons should appear when bbox is created in empty annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = annotationSet.labels[0].annotations[0];

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

    const wrapper2 = mount(AnnotationRow, {
      store,
      propsData: {
        label,
        annotationSet,
        annotation,
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
    expect(await wrapper2.findAll(".action-buttons").length).toEqual(1);
  });

  it("Only show 'accept' button on hover on filled annotations", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];

    const wrapper = mount(AnnotationRow, {
      store,
      propsData: {
        label,
        annotationSet,
        annotation,
      },
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .find(".buttons-container .action-buttons .annotation-accept-btn")
        .exists()
    ).toBe(false);

    await wrapper.findComponent(".annotation-content").trigger("mouseover");

    expect(
      await wrapper
        .find(".buttons-container .action-buttons .annotation-accept-btn")
        .isVisible()
    ).toBe(true);

    await wrapper.findComponent(".annotation-content").trigger("mouseout");

    expect(
      await wrapper
        .find(".buttons-container .action-buttons .annotation-accept-btn")
        .exists()
    ).toBe(false);
  });

  it("Should only show the Rejected title when there are rejected labels", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const handleReject = jest.fn().mockName("rejectMissingAnnotations");

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
        label_set: annotationSet.label_set.id,
        label: label.id,
        document: store.state.document.documentId,
        annotation_set: annotationSet,
      },
    ];

    expect(await wrapper.findAll(".rejected-labels-list").exists()).toBe(false);

    await wrapper.findComponent(".empty-annotation").trigger("mouseenter");

    await wrapper2.setData({
      showReject: true,
    });

    await wrapper
      .findComponent(".action-buttons .reject-button-container .reject-btn")
      .trigger("click");

    await store.dispatch("document/setMissingAnnotations", rejectedAnnotation);

    expect(store.state.document.missingAnnotations.length).toEqual(1);

    expect(await wrapper.findComponent(".rejected-labels-list").exists()).toBe(
      true
    );

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

    expect(await wrapper.findAll(".rejected-labels-list").exists()).toBe(false);
  });

  it("Rejecting should remove item from the label list, and it should show under Rejected", async () => {
    const annotationSet = require("../mock/document.json").annotation_sets[0];

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const rejectedAnnotation = [
      {
        label_set: annotationSet.label_set.id,
        label: annotationSet.labels[0].id,
        document: store.state.document.documentId,
        annotation_set: annotationSet.id,
      },
    ];

    await store.dispatch("document/setMissingAnnotations", rejectedAnnotation);

    expect(
      await wrapper.findAll(".annotation-row .label-name span").at(0).text()
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
    const annotationSet = require("../mock/document.json").annotation_sets[0];

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const rejectedAnnotation = [
      {
        label_set: annotationSet.label_set.id,
        label: annotationSet.labels[0].id,
        document: store.state.document.documentId,
        annotation_set: annotationSet.id,
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
      await wrapper.findAll(".annotation-row .label-name span").at(0).text()
    ).toBe("Anrede");
  });

  it("Finish review button should be always visible", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .findComponent(
          ".labels-top-bar .top-bar .action-buttons .finish-review-btn"
        )
        .isVisible()
    ).toBe(true);
  });

  it("If document has been reviewed, document should be in public mode and button disabled", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .findComponent(
          ".labels-top-bar .top-bar .action-buttons .finish-review-btn"
        )
        .attributes("disabled")
    ).not.toBe("undefined");
  });

  it("Reject all empty button should always be visible", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper.find(".action-buttons .reject-all .reject-btn").isVisible()
    ).toBe(true);
  });

  it("Reject all button should show how many empty labels are in the annotation set", async () => {
    const annotationSet = store.state.document.annotationSets[0];

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const emptyLabels = annotationSet.labels.filter(
      (label) => label.annotations.length === 0
    );

    expect(
      await wrapper
        .find(".action-buttons .reject-all .reject-btn")
        .text()
        .includes(emptyLabels.length)
    ).toBe(true);
  });

  it("Clicking the 'reject all empty' button should send the request to the endpoint", async () => {
    const handleReject = jest.fn().mockName("rejectMissingAnnotations");

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper
      .find(".action-buttons .reject-all .reject-btn")
      .trigger("click");

    await handleReject();

    expect(handleReject).toHaveBeenCalledTimes(1);
  });

  it("Accept all empty button should always be visible", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .find(".action-buttons .accept-all .accept-all-btn")
        .isVisible()
    ).toBe(true);
  });

  it("Accept all button should show how many unrevised/unaccepted annotations are in the annotation set", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const labels = annotationSet.labels;
    const annotations = labels.flatMap((label) => {
      return label.annotations;
    });

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const pendingAnnotations = annotations.filter(
      (ann) => !ann.revised && !ann.is_correct
    );

    expect(
      await wrapper
        .find(".action-buttons .accept-all .accept-all-btn")
        .text()
        .includes(pendingAnnotations.length)
    ).toBe(true);
  });

  it("Clicking the 'accept all empty' button should send the request to the endpoint", async () => {
    const updateAnnotations = jest.fn().mockName("updateMultipleAnnotations");

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper
      .find(".action-buttons .accept-all .accept-all-btn")
      .trigger("click");

    await updateAnnotations();

    expect(updateAnnotations).toHaveBeenCalledTimes(1);
  });
});
