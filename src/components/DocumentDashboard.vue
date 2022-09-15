<style scoped lang="scss" src="../assets/scss/document_dashboard.scss"></style>

<template>
  <div class="dashboard">
    <div class="dashboard-top-bar" v-if="pages && pages.length > 0">
      <DocumentTopBar
        @handle-message="handleMessage"
        @handle-error="handleError"
      />
    </div>
    <div class="dashboard-viewer">
      <DocumentThumbnails ref="documentPages" />
      <ScrollingDocument
        class="dashboard-document"
        ref="scrollingDocument"
        @pages-reset="fitWidth"
        @handle-message="handleMessage"
        @handle-error="handleError"
        :scroll="scroll"
      />
      <DocumentAnnotations
        ref="annotations"
        @handle-message="handleMessage"
        @handle-error="handleError"
        :handleScroll="handleScroll"
        :scroll="scroll"
      />
      <transition name="slide-fade">
        <div v-if="showError" class="error-message">
          <ErrorMessage
            @close-error="showError = false"
            :message="errorMessage"
          />
        </div>
      </transition>
    </div>
    <div class="not-optimized" v-if="!optimized">
      <NotOptimizedViewportModal />
    </div>
    <div class="not-supported" v-if="!isMinimunWidth">
      <div class="text">{{ $t("resolution_not_supported") }}</div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import {
  PIXEL_RATIO,
  VIEWPORT_RATIO,
  MINIMUM_APP_WIDTH,
  MINIMUM_OPTIMIZED_APP_WIDTH
} from "../constants";
import { DocumentTopBar } from "./DocumentTopBar";
import { DocumentPage, DummyPage, ScrollingDocument } from "./DocumentPage";
import { DocumentThumbnails } from "./DocumentThumbnails";
import { DocumentAnnotations } from "./DocumentAnnotations";
import { DocumentsList } from "./DocumentsList";
import ErrorMessage from "./ErrorMessage";
import NotOptimizedViewportModal from "./NotOptimizedViewportModal";

/**
 * This component shows the PDF pages in a scrolling component and
 * the annotations on the side.
 */
export default {
  name: "DocumentDashboard",
  components: {
    DocumentTopBar,
    DummyPage,
    ScrollingDocument,
    DocumentPage,
    DocumentThumbnails,
    DocumentAnnotations,
    DocumentsList,
    ErrorMessage,
    NotOptimizedViewportModal
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
    ...mapState("document", ["pages"])
  },
  created() {
    window.addEventListener("resize", this.fitWidth);
  },
  destroyed() {
    window.removeEventListener("resize", this.fitWidth);
  },
  data() {
    return {
      isMinimunWidth: true,
      optimized: true,
      showError: false,
      errorMessage: null,
      scroll: false
    };
  },
  mounted() {
    this.isMinimunWidth = this.$el.offsetWidth >= MINIMUM_APP_WIDTH;
    this.optimized = this.$el.offsetWidth >= MINIMUM_OPTIMIZED_APP_WIDTH;
  },
  methods: {
    pageWidthScale() {
      const { defaultViewport, $el } = this;
      if (!defaultViewport.width) return 0;

      const elementsWidth =
        this.$refs.documentPages.$el.clientWidth +
        this.$refs.annotations.$el.clientWidth +
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

    /**
     * Determine an ideal scale using viewport of document's first page, the pixel ratio
     * from the browser and a subjective scale factor based on the screen size.
     */
    fitWidth() {
      this.isMinimunWidth = this.$el.offsetWidth >= MINIMUM_APP_WIDTH;
      this.optimized = this.$el.offsetWidth >= MINIMUM_OPTIMIZED_APP_WIDTH;

      const scale = this.pageWidthScale();
      this.updateScale(scale, {
        isOptimal: !this.optimalScale
      });
    },

    fitAuto() {
      const scale = Math.min(this.pageWidthScale(), this.pageHeightScale());
      this.updateScale(scale);
    },

    updateScale(scale, { isOptimal = false } = {}) {
      if (!scale) return;
      this.$store.dispatch("display/updateScale", { scale, isOptimal });
    },

    handleScroll(value) {
      this.scroll = value;
    },

    handleError() {
      this.showError = true;
    },

    handleMessage(message) {
      this.errorMessage = message;
    }
  },

  watch: {
    fit(fit) {
      switch (fit) {
        case "width":
          this.fitWidth();
          break;

        case "auto":
          this.fitAuto();
          break;

        default:
          break;
      }
    }
  }
};
</script>
