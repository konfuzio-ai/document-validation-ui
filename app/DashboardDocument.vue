<template>
  <div class="dashboard-viewer">
    <DocumentPages ref="documentPages"></DocumentPages>
    <ScrollingDocument
      class="dashboard-document"
      v-bind="{ pages, pageCount }"
      v-slot="{ page, isPageFocused, isElementFocused }"
      ref="scrollingDocument"
      :enable-page-jump="true"
      @page-jump="onPageJump"
      @pages-reset="fitWidth"
    >
      <keep-alive>
        <DummyPage
          v-if="!pageInVisibleRange(page.pageNumber)"
          v-bind="{ page, isPageFocused, isElementFocused }"
        />
        <PDFPage
          v-else
          v-bind="{
            page,
            isPageFocused,
            isElementFocused
          }"
          @page-rendered="onPageRendered"
          @page-errored="onPageErrored"
          @page-focus="onPageFocused"
        />
      </keep-alive>
    </ScrollingDocument>
    <LabelSets ref="labelSets"></LabelSets>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import { PIXEL_RATIO, VIEWPORT_RATIO } from "./constants";
import DummyPage from "./DummyPage";
import ScrollingDocument from "./ScrollingDocument";
import PDFPage from "./PDFPage";
import DocumentPages from "./DocumentPages";
import LabelSets from "./LabelSets";

/**
 * This component shows the PDF pages in a scrolling component and
 * the annotations on the side.
 */
export default {
  name: "DashboardDocument",
  components: {
    DummyPage,
    ScrollingDocument,
    PDFPage,
    DocumentPages,
    LabelSets
  },
  computed: {
    defaultViewport() {
      if (!this.pages.length)
        return {
          width: 0,
          height: 0
        };
      const [page] = this.pages;

      return { width: page.size[0], height: page.size[1] };
    },

    isPortrait() {
      const { width, height } = this.defaultViewport;
      return width <= height;
    },
    ...mapState("display", ["scale", "fit"]),
    ...mapState("document", ["pages"]),
    ...mapGetters("document", ["pageCount"]),
    ...mapGetters("display", ["visiblePageRange"])
  },
  created() {
    window.addEventListener("resize", this.fitWidth);
  },
  destroyed() {
    window.removeEventListener("resize", this.fitWidth);
  },
  methods: {
    pageWidthScale() {
      const { defaultViewport, $el } = this;
      if (!defaultViewport.width) return 0;

      const elementsWidth =
        this.$refs.documentPages.$el.clientWidth +
        this.$refs.labelSets.$el.clientWidth +
        1;

      return (
        (($el.clientWidth - elementsWidth) * PIXEL_RATIO * VIEWPORT_RATIO) /
        defaultViewport.width
      );
    },

    pageHeightScale() {
      const { defaultViewport, $el } = this;
      if (!defaultViewport.height) return 0;

      return (
        ($el.clientHeight * PIXEL_RATIO * VIEWPORT_RATIO) /
        defaultViewport.height
      );
    },

    pageInVisibleRange(pageNumber) {
      return this.visiblePageRange.includes(pageNumber);
    },

    /**
     * Determine an ideal scale using viewport of document's first page, the pixel ratio
     * from the browser and a subjective scale factor based on the screen size.
     */
    fitWidth() {
      const scale = this.pageWidthScale();
      this.updateScale(scale, {
        isOptimal: !this.optimalScale
      });
    },

    updateScale(scale, { isOptimal = false } = {}) {
      if (!scale) return;
      this.$store.dispatch("display/updateScale", { scale, isOptimal });
    },

    /**
     * Scrolls the ScrollingDocument to the offset specified by scrollTop
     * (i.e., another page).
     */
    onPageJump(scrollTop) {
      const actualScroll = scrollTop;
      this.$refs.scrollingDocument.$el.scrollTop = actualScroll;
    },

    onPageFocused(pageNumber) {
      this.$parent.$emit("page-focus", pageNumber);
    },

    onPageRendered(payload) {
      this.$parent.$emit("page-rendered", payload);
    },

    onPageErrored(payload) {
      this.$parent.$emit("page-errored", payload);
    }
  },

  watch: {
    fit() {
      this.fitWidth();
    }
  }
};
</script>
