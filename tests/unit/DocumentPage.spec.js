import { render } from "../utils/render";
import { getData, getGetter } from "../utils/store";
import { ScrollingDocument, ToolBar } from "../../src/components/DocumentPage";

describe("Document Page Component", () => {
  it("document contains two scrolling pages", async () => {
    const wrapper = render(ScrollingDocument, true);

    expect(await wrapper.findAll(".scrolling-page").length).toBe(2);
  });

  it("document should have page 1 visible", async () => {
    render(ScrollingDocument, false, {
      pages: getData("document").pages,
    });

    expect(getGetter("display/visiblePageRange")).toContain(1);
  });

  it("Toolbar should be visible", async () => {
    const wrapper = render(ToolBar, true);

    expect(await wrapper.findComponent(".toolbar-container"));
  });

  it("Toolbar should have icons and text visible", async () => {
    const wrapper = render(ToolBar, true);

    expect(await wrapper.findComponent(".edit-icon").exists()).toBe(true);
    expect(await wrapper.findComponent(".edit-text").exists()).toBe(true);
    expect(await wrapper.findComponent(".fit-zoom").exists()).toBe(true);
    expect(await wrapper.findComponent(".zoom-in").exists()).toBe(true);
    expect(await wrapper.findComponent(".zoom-out").exists()).toBe(true);
  });
});
