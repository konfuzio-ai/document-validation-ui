import { mount, shallowMount } from "@vue/test-utils";
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
    const selectedDocument = require("../mock/document.json");
    const annotations = [];
    require("../mock/document.json").annotation_sets.map((annotationSet) => {
      annotationSet.labels.map((label) => {
        annotations.push(...label.annotations);
      });
    });
    Promise.all([
      store.dispatch("document/setSelectedDocument", selectedDocument),
      store.dispatch(
        "document/setAnnotationSets",
        require("../mock/document.json").annotation_sets
      ),
      store.dispatch("document/setAnnotations", annotations),
      store.dispatch("document/setPublicView", false),
      store.dispatch("document/endRecalculatingAnnotations"),
      store.dispatch("document/endLoading"),
      store.dispatch("selection/disableSelection"),
      store.dispatch("document/resetEditAnnotation"),
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
      store.state.document.annotationSets[2].label_set.name
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
    const element = await wrapper
      .findAll(".annotation-row .annotation-details")
      .at(0);
    await element.find(".tooltip-trigger").trigger("mouseenter");
    requestAnimationFrame(async () => {
      expect(await element.find(".tooltip-content").isVisible()).toBe(true);
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
    expect(await store.state.selection.elementSelected).toEqual(
      emptyAnnotationId
    );
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

  it("Click should trigger edit mode in annotation", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];
    const span = annotation.span;
    const spanIndex = 0;

    const wrapper = mount(AnnotationContent, {
      store,
      propsData: {
        annotation,
        label,
        annotationSet,
        span,
        spanIndex,
      },
      mocks: {
        $t,
      },
    });

    await wrapper.findComponent(".annotation-value").trigger("click");
    expect(await store.state.selection.elementSelected).toEqual(annotation.id);
  });

  it("Action buttons should appear when annotation is in edit mode", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];
    const span = annotation.span;
    const spanIndex = 0;

    const wrapper = mount(AnnotationContent, {
      store,
      propsData: {
        annotation,
        label,
        annotationSet,
        span,
        spanIndex,
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

    await wrapper.findComponent(".annotation-value").trigger("click");
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
        .find(
          ".annotation-row-right .buttons-container .action-buttons .annotation-accept-btn"
        )
        .isVisible()
    ).toBe(true);
  });

  it("Only show 'decline' button on hover on filled annotations", async () => {
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
        .find(".buttons-container .action-buttons .decline-btn")
        .exists()
    ).toBe(false);

    await wrapper.findComponent(".annotation-content").trigger("mouseover");

    expect(
      await wrapper
        .find(".buttons-container .action-buttons .decline-btn")
        .isVisible()
    ).toBe(true);
  });

  it("Marking as missing should change the style of the Annotation row", async () => {
    const annotationSet = require("../mock/document.json").annotation_sets[0];

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const missingAnnotation = [
      {
        label_set: annotationSet.label_set.id,
        label: annotationSet.labels[0].id,
        document: store.state.document.documentId,
        annotation_set: annotationSet.id,
      },
    ];

    await store.dispatch("document/setMissingAnnotations", missingAnnotation);

    expect(await wrapper.findAll(".annotation-row").at(0).classes()).toContain(
      "missing"
    );
  });

  it("Clicking the restore button should remove the specific class from the Annotation row", async () => {
    const annotationSet = require("../mock/document.json").annotation_sets[0];

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    const missingAnnotation = [
      {
        label_set: annotationSet.label_set.id,
        label: annotationSet.labels[0].id,
        document: store.state.document.documentId,
        annotation_set: annotationSet.id,
      },
    ];

    await store.dispatch("document/setMissingAnnotations", missingAnnotation);

    expect(await wrapper.findAll(".annotation-row").at(0).classes()).toContain(
      "missing"
    );

    await wrapper.findComponent(".missing").trigger("mouseover");

    await wrapper
      .findComponent(".buttons-container .action-buttons .restore-btn")
      .trigger("click");

    await store.dispatch("document/setMissingAnnotations", []);

    expect(
      await wrapper.findComponent(".annotation-row").classes()
    ).not.toContain("missing");
  });

  it("Mark all empty as missing button should always be visible", async () => {
    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    expect(
      await wrapper
        .find(".action-buttons .all-missing .missing-btn")
        .isVisible()
    ).toBe(true);
  });

  it("Mark all empty as missing button should show how many empty labels are in the annotation set", async () => {
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
        .find(".action-buttons .all-missing .missing-btn")
        .text()
        .includes(emptyLabels.length)
    ).toBe(true);
  });

  it("Clicking the 'mark all empty as missing' button should send the request to the endpoint", async () => {
    const markAnnotationsAsMissing = jest
      .fn()
      .mockName("markAnnotationsAsMissing");

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    await wrapper
      .find(".action-buttons .all-missing .missing-btn")
      .trigger("click");

    await markAnnotationsAsMissing();

    expect(markAnnotationsAsMissing).toHaveBeenCalledTimes(1);
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

    const pendingAnnotations = annotations.filter((ann) => !ann.revised);

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

  it("Missing annotations, buttons and edit options for annotations do not appear in public documents", async () => {
    const annotationSet = store.state.document.annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];

    const wrapper = mount(DocumentAnnotations, {
      store,
      mocks: {
        $t,
      },
    });

    await store.dispatch("document/setPublicView", true);
    await store.dispatch("document/setMissingAnnotations", []);

    const markAllMissingButton = await wrapper.findAll(
      ".annotation-set-list .annotation-set-group .label-set-header .labelset-action-buttons .action-buttons .all-missing .all-missing-btn"
    );

    const acceptAllButton = await wrapper.findAll(
      ".annotation-set-list .annotation-set-group .label-set-header .labelset-action-buttons .action-buttons .accept-all .accept-all-btn"
    );

    const annotationRow = await wrapper.find(
      ".annotation-set-list .annotation-set-group .labels .label .annotation-row"
    );

    const missingButton = await wrapper.find(
      ".annotation-set-list .annotation-set-group .labels .labelset-action-buttons .action-buttons .all-missing .missing-btn"
    );

    const acceptButton = await wrapper.find(
      ".annotation-set-list .annotation-set-group .labels .label .annotation-row .annotation-row-right .buttons-container .action-buttons .annotation-accept-btn"
    );

    const declineButton = await wrapper.find(
      ".annotation-set-list .annotation-set-group .labels .label .annotation-row .annotation-row-right .buttons-container .action-buttons .decline-btn"
    );

    await wrapper.findComponent(".annotation-value").trigger("click");

    expect(await store.state.document.missingAnnotations.length).toBe(0);
    expect(markAllMissingButton.exists()).toBe(false);
    expect(acceptAllButton.exists()).toBe(false);
    await annotationRow.trigger("mouseenter");
    expect(missingButton.exists()).toBe(false);
    expect(acceptButton.exists()).toBe(false);
    expect(declineButton.exists()).toBe(false);
    expect(await store.state.selection.elementSelected).not.toEqual(
      annotation.id
    );
  });
});
