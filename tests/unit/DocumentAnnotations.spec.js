import {
  DocumentAnnotations,
  DocumentLabel,
  EmptyAnnotation,
  AnnotationContent,
  AnnotationRow,
} from "../../src/components/DocumentAnnotations";
import { render } from "../utils/render";
import { dispatch, getData } from "../utils/store";

describe("Document Annotations Component", () => {
  beforeEach(async () => {
    await dispatch("selection/disableSelection");
    await dispatch("document/resetEditAnnotation");
  });
  it("sidebar has group of label sets", async () => {
    const wrapper = render(DocumentAnnotations, false);

    expect(
      await wrapper.findAll(".annotation-set-group").length
    ).toBeGreaterThan(0);
  });

  it("label set name appears", async () => {
    const wrapper = render(DocumentAnnotations, false);
    expect(await wrapper.findAll(".label-set-name").at(2).text()).toContain(
      getData("document").annotationSets[2].label_set.name
    );
  });

  it("label name appears", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];

    const wrapper = render(DocumentLabel, false, {
      annotationSet,
      label,
    });
    expect(await wrapper.find(".annotation-row .label-name").text()).toContain(
      label.name
    );
  });

  it("check if annotation info appears when hovering", async () => {
    const wrapper = render(DocumentAnnotations, false);
    const element = await wrapper
      .findAll(".annotation-row .annotation-details")
      .at(0);
    await element.find(".tooltip-trigger").trigger("mouseenter");
    requestAnimationFrame(async () => {
      expect(await element.find(".tooltip-content").isVisible()).toBe(true);
    });
  });

  it("Click should trigger edit mode in empty annotation", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    let emptyAnnotationId;
    const isMissingAnnotation = false;

    if (annotationSet.id) {
      emptyAnnotationId = `${annotationSet.id}_${label.id}`;
    } else {
      emptyAnnotationId = `${annotationSet.label_set.id}_${label.id}`;
    }

    const wrapper = render(EmptyAnnotation, false, {
      label,
      annotationSet,
      isMissingAnnotation,
    });

    await wrapper.findComponent(".annotation-value").trigger("click");
    expect(await getData("selection").elementSelected).toEqual(
      emptyAnnotationId
    );
  });

  it("Action buttons should appear when bbox is created in empty annotation", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = annotationSet.labels[0].annotations[0];
    const isMissingAnnotation = false;

    const wrapper = render(EmptyAnnotation, false, {
      label,
      annotationSet,
      isMissingAnnotation,
    });

    const wrapper2 = render(AnnotationRow, false, {
      label,
      annotationSet,
      annotation,
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
    await dispatch("selection/setSpanSelection", sampleBbox);
    expect(await wrapper2.findAll(".action-buttons").length).toEqual(1);
  });

  it("Click should trigger edit mode in annotation", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];
    const span = annotation.span;
    const spanIndex = 0;

    const wrapper = render(AnnotationContent, false, {
      annotation,
      label,
      annotationSet,
      span,
      spanIndex,
    });

    await wrapper.findComponent(".annotation-value").trigger("click");
    expect(await getData("selection").elementSelected).toEqual(annotation.id);
  });

  it("Action buttons should appear when annotation is in edit mode", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];
    const span = annotation.span;
    const spanIndex = 0;

    const wrapper = render(AnnotationContent, false, {
      annotation,
      label,
      annotationSet,
      span,
      spanIndex,
    });

    const wrapper2 = render(AnnotationRow, false, {
      label,
      annotationSet,
      annotation,
    });

    await wrapper.findComponent(".annotation-value").trigger("click");
    expect(await wrapper2.findAll(".action-buttons").length).toEqual(1);
  });

  it("Only show 'accept' button on hover on filled annotations", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];

    const wrapper = render(AnnotationRow, false, {
      label,
      annotationSet,
      annotation,
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
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];

    const wrapper = render(AnnotationRow, false, {
      label,
      annotationSet,
      annotation,
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
    const annotationSet = getData("document").annotationSets[0];

    const wrapper = render(DocumentAnnotations, false);

    const missingAnnotation = [
      {
        label_set: annotationSet.label_set.id,
        label: annotationSet.labels[0].id,
        document: getData("document").documentId,
        annotation_set: annotationSet.id,
      },
    ];

    await dispatch("document/setMissingAnnotations", missingAnnotation);

    expect(await wrapper.findAll(".annotation-row").at(0).classes()).toContain(
      "missing"
    );
  });

  it("Clicking the restore button should remove the specific class from the Annotation row", async () => {
    const annotationSet = getData("document").annotationSets[0];

    const wrapper = render(DocumentAnnotations, false);

    const missingAnnotation = [
      {
        label_set: annotationSet.label_set.id,
        label: annotationSet.labels[0].id,
        document: getData("document").documentId,
        annotation_set: annotationSet.id,
      },
    ];

    await dispatch("document/setMissingAnnotations", missingAnnotation);

    expect(await wrapper.findAll(".annotation-row").at(0).classes()).toContain(
      "missing"
    );

    await wrapper.findComponent(".missing").trigger("mouseover");

    await wrapper
      .findComponent(".buttons-container .action-buttons .restore-btn")
      .trigger("click");

    await dispatch("document/setMissingAnnotations", []);

    expect(
      await wrapper.findComponent(".annotation-row").classes()
    ).not.toContain("missing");
  });

  it("Mark all empty as missing button should always be visible", async () => {
    const wrapper = render(DocumentAnnotations, false);

    expect(
      await wrapper
        .find(".action-buttons .all-missing .missing-btn")
        .isVisible()
    ).toBe(true);
  });

  it("Mark all empty as missing button should show how many empty labels are in the annotation set", async () => {
    const annotationSet = getData("document").annotationSets[0];

    const wrapper = render(DocumentAnnotations, false);

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

    const wrapper = render(DocumentAnnotations, false);

    await wrapper
      .find(".action-buttons .all-missing .missing-btn")
      .trigger("click");

    await markAnnotationsAsMissing();

    expect(markAnnotationsAsMissing).toHaveBeenCalledTimes(1);
  });

  it("Accept all empty button should always be visible", async () => {
    const wrapper = render(DocumentAnnotations, false);

    expect(
      await wrapper
        .find(".action-buttons .accept-all .accept-all-btn")
        .isVisible()
    ).toBe(true);
  });

  it("Accept all button should show how many unrevised/unaccepted annotations are in the annotation set", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const labels = annotationSet.labels;
    const annotations = labels.flatMap((label) => {
      return label.annotations;
    });

    const wrapper = render(DocumentAnnotations, false);

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

    const wrapper = render(DocumentAnnotations, false);

    await wrapper
      .find(".action-buttons .accept-all .accept-all-btn")
      .trigger("click");

    await updateAnnotations();

    expect(updateAnnotations).toHaveBeenCalledTimes(1);
  });

  it("Missing annotations, buttons and edit options for annotations do not appear in public documents", async () => {
    const annotationSet = getData("document").annotationSets[0];
    const label = annotationSet.labels[0];
    const annotation = label.annotations[0];
    const wrapper = render(DocumentAnnotations, false);

    await dispatch("document/setPublicView", true);
    await dispatch("document/setMissingAnnotations", []);

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

    expect(await getData("document").missingAnnotations.length).toBe(0);
    expect(markAllMissingButton.exists()).toBe(false);
    expect(acceptAllButton.exists()).toBe(false);
    await annotationRow.trigger("mouseenter");
    expect(missingButton.exists()).toBe(false);
    expect(acceptButton.exists()).toBe(false);
    expect(declineButton.exists()).toBe(false);

    expect(await getData("selection").elementSelected).not.toEqual(
      annotation.id
    );
  });

  it("Expands and hides grouped annotations dropdown when clicking Label group name", async () => {
    const annotationSet = getData("document").annotationSets[1];
    const label = annotationSet.labels[0];

    await dispatch("document/setPublicView", false);

    const wrapper = render(
      DocumentLabel,
      true,
      { label: label, annotationSet: annotationSet },
      {
        showAnnotationsGroup: false,
        nonMultipleAnnotationsExtracted: true,
        acceptedAnnotationsGroupCounter: 0,
      }
    );

    await wrapper.findAll(".label .label-group").trigger("click");

    expect(
      await wrapper.findComponent(" .label-group-annotation-list").exists()
    ).toBe(true);

    await wrapper.findAll(".label .label-group").trigger("click");

    expect(
      await wrapper.findComponent(" .label-group-annotation-list").exists()
    ).toBe(false);
  });

  it("Shows message to user if an annotation set has no labels", async () => {
    const wrapper = render(DocumentAnnotations, false);

    await dispatch("document/setPublicView", false);

    expect(
      await wrapper.findComponent(".annotation-set-group .no-labels").exists()
    ).toBe(true);

    expect(
      await wrapper.findAll(".annotation-set-group .no-labels").length
    ).toBe(1);
  });

  it("Shows message to user if public mode and annotation set has no filled labels", async () => {
    const annotationSets = getData("document").annotationSets;
    const annotationSetHasAnnotations = jest.fn();
    const wrapper = render(DocumentAnnotations, true);

    await dispatch("document/setPublicView", true);

    annotationSets.map((annotationSet) => {
      return annotationSetHasAnnotations(annotationSet);
    });

    expect(
      await wrapper.findAll(".annotation-set-group .no-labels").length
    ).toBeGreaterThan(2);

    await dispatch("document/setPublicView", false);
  });
});
