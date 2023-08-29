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
    expect(await wrapper.findComponent(".download-file").exists()).toBe(true);
    expect(await wrapper.findComponent(".fit-zoom").exists()).toBe(true);
    expect(await wrapper.findComponent(".zoom-in").exists()).toBe(true);
    expect(await wrapper.findComponent(".zoom-out").exists()).toBe(true);
  });

  it("Opens a menu when clicking the download icon in the toolbar", async () => {
    const wrapper = render(ToolBar, false);

    await wrapper
      .findComponent(".download-file .dropdown .dropdown-trigger")
      .trigger("click");

    expect(await wrapper.findComponent(".dropdown-content").exists()).toBe(
      true
    );
  });

  it("Shows 2 options in the download menu", async () => {
    const wrapper = render(ToolBar, false);

    await wrapper
      .findComponent(".download-file .dropdown .dropdown-trigger")
      .trigger("click");

    expect(await wrapper.findAllComponents(".dropdown-item").length).toBe(2);
  });

  it("Downloads file when clicking download menu option", async () => {
    const wrapper = render(ToolBar, false);
    const url = "https://testing.konfuzio.com/doc/show/1369630/";
    const fileName = getData("document").selectedDocument.data_file_name;

    const link = {
      click: jest.fn(),
    };

    global.URL.createObjectURL = jest.fn(() => url);
    global.URL.revokeObjectURL = jest.fn();
    global.Blob = function (content, options) {
      return { content, options };
    };

    jest.spyOn(document, "createElement").mockImplementation(() => link);

    await wrapper
      .findComponent(".download-file .dropdown .dropdown-trigger")
      .trigger("click");
    await wrapper.findAllComponents(".dropdown-item").at(1).trigger("click");

    wrapper.vm.$nextTick(() => {
      expect(wrapper.findComponent("a").exists()).toBe(true);
      expect(link.href).toBe(url);
      expect(link.download).toBe(fileName);
      expect(link.click).toHaveBeenCalledTimes(1);
    });
  });
});
