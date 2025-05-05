import { render } from "../utils/render";
import { DocumentThumbnails } from "../../src/components/DocumentThumbnails";

describe("Document Thumbnails Component", () => {
  it("check number of thumbnails", async () => {
    const wrapper = render(DocumentThumbnails, true);
    expect(await wrapper.findAll(".document-thumbnail").length).toEqual(2);
  });

  it("check if first thumbnail is selected", async () => {
    const wrapper = render(DocumentThumbnails, true);
    expect(await wrapper.findAll(".img-thumbnail")[0].classes()).toContain(
      "selected"
    );
  });

  it("check if second thumbnail is not selected", async () => {
    const wrapper = render(DocumentThumbnails, true);
    expect(await wrapper.findAll(".img-thumbnail")[1].classes()).not.toContain(
      "selected"
    );
  });

  it("check if second thumbnail has text 2", async () => {
    const wrapper = render(DocumentThumbnails, true);
    expect(await wrapper.findAll(".number-thumbnail")[1].text()).toBe("2");
  });
});
