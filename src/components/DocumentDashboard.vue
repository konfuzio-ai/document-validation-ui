<style scoped lang="scss">
.dashboard-viewer {
  overflow: hidden;
  display: flex;
  background: $grey-lighter;
  .dashboard-document {
    overflow: auto;
    height: calc(100vh - $header-size);
    flex: 1;
    background-image: radial-gradient(#bfc1c9 0.8px, #93989f 0.1px);
    background-size: 9px 9px;
  }
  @media print {
    .dashboard-document {
      position: static;
    }
  }
  .not-supported {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

<template>
  <div class="dashboard-viewer">
    <DocumentThumbnails ref="documentPages" />
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
        <DocumentPage
          v-else
          v-bind="{
            page,
            isPageFocused,
            isElementFocused
          }"
        />
      </keep-alive>
    </ScrollingDocument>
    <DocumentLabelSets ref="labelSets" />
    <div class="not-supported" v-if="!isMinimunWidth">
      <div class="text">{{ $t("resolution_not_supported") }}</div>
    </div>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import { PIXEL_RATIO, VIEWPORT_RATIO, MINIMUM_APP_WIDTH } from "../constants";
import { DocumentPage, DummyPage, ScrollingDocument } from "./DocumentPage";
import { DocumentThumbnails } from "./DocumentThumbnails";
import { DocumentLabelSets } from "./DocumentAnnotations";

/**
 * This component shows the PDF pages in a scrolling component and
 * the annotations on the side.
 */
export default {
  name: "DocumentDashboard",
  components: {
    DummyPage,
    ScrollingDocument,
    DocumentPage,
    DocumentThumbnails,
    DocumentLabelSets
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
  data() {
    return {
      isMinimunWidth: true
    };
  },
  mounted() {
    this.isMinimunWidth = this.$el.offsetWidth >= MINIMUM_APP_WIDTH;
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
      this.isMinimunWidth = this.$el.offsetWidth >= MINIMUM_APP_WIDTH;

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
    }
  },

  watch: {
    fit() {
      this.fitWidth();
    }
  }
};
</script>
