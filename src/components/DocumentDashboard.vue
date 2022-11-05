<style scoped lang="scss" src="../assets/scss/document_dashboard.scss"></style>

<template>
  <div class="dashboard">
    <div
      class="dashboard-top-bar"
      v-if="selectedDocument && selectedDocument.pages.length > 0"
    >
      <DocumentTopBar />
    </div>
    <div
      :class="[
        'dashboard-viewer',
        editMode ? 'edit-mode' : '',
        !imageLoaded && 'loading-skeleton'
      ]"
    >
      <DocumentThumbnails ref="documentPages" v-if="!editMode" />
      <ScrollingDocument
        class="dashboard-document"
        ref="scrollingDocument"
        @pages-reset="fitWidth"
        :scroll="scroll"
      />
      <DocumentAnnotations
        ref="annotations"
        v-if="!editMode"
        :handleScroll="handleScroll"
        :scroll="scroll"
      />
      <DocumentEdit ref="editView" v-else />

      <transition name="slide-fade">
        <div
          v-if="showError"
          class="error-message"
          :style="{ width: `${errorMessageWidth}px` }"
        >
          <ErrorMessage />
        </div>
      </transition>
    </div>
    <div class="error-modal" v-if="showDocumentError">
      <DocumentError />
    </div>
    <div class="not-optimized" v-if="!optimalResolution">
      <NotOptimizedViewportModal />
    </div>
    <div class="not-supported" v-if="!isMinimunWidth">
      <div class="text">{{ $t("resolution_not_supported") }}</div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
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
import { DocumentEdit } from "./DocumentEdit";
import ErrorMessage from "./ErrorMessage";
import NotOptimizedViewportModal from "./NotOptimizedViewportModal";
import DocumentError from "./DocumentError";

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
    DocumentEdit,
    ErrorMessage,
    NotOptimizedViewportModal,
    DocumentError
  },
  computed: {
    ...mapState("display", ["scale", "fit", "optimalResolution"]),
    ...mapState("document", [
      "showError",
      "showDocumentError",
      "imageLoaded",
      "errorMessageWidth",
      "selectedDocument"
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("document", ["defaultPageSize"]),

    defaultViewport() {
      if (!this.defaultPageSize) {
        return {
          width: 0,
          height: 0
        };
      }
      return {
        width: this.defaultPageSize[0],
        height: this.defaultPageSize[1]
      };
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateFit();
    });

    if (this.$refs.scrollingDocument) {
      this.resizeObserver.observe(this.$refs.scrollingDocument.$el);
    }

    this.isMinimunWidth = this.$el.offsetWidth >= MINIMUM_APP_WIDTH;
    this.$store.dispatch(
      "display/updateOptimalResolution",
      this.$el.offsetWidth >= MINIMUM_OPTIMIZED_APP_WIDTH
    );
  },
  destroyed() {
    if (this.$refs.scrollingDocument) {
      this.resizeObserver.unobserve(this.$refs.scrollingDocument.$el);
    }
  },
  data() {
    return {
      isMinimunWidth: true,
      scroll: false,
      resizeObserver: null
    };
  },
  methods: {
    pageWidthScale() {
      const { defaultViewport, $el } = this;
      if (!defaultViewport.width) return 0;

      let elementsWidth = 1;
      if (this.$refs.editView) {
        elementsWidth += this.$refs.editView.$el.clientWidth;
      }
      if (this.$refs.documentPages) {
        elementsWidth += this.$refs.documentPages.$el.clientWidth;
      }
      if (this.$refs.annotations) {
        elementsWidth += this.$refs.annotations.$el.clientWidth;
      }

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
      this.$store.dispatch(
        "display/updateOptimalResolution",
        this.$el.offsetWidth >= MINIMUM_OPTIMIZED_APP_WIDTH
      );

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
    updateFit() {
      switch (this.fit) {
        case "width":
          this.fitWidth();
          break;

        case "auto":
          this.fitAuto();
          break;

        default:
          console.log("undefined");
          break;
      }
    }
  },

  watch: {
    fit() {
      this.updateFit();
    }
  }
};
</script>
