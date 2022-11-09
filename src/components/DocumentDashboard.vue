<style scoped lang="scss" src="../assets/scss/document_dashboard.scss"></style>

<template>
  <div class="dashboard">
    <DocumentTopBar />
    <div :class="['dashboard-viewer', editMode ? 'edit-mode' : '']">
      <DocumentThumbnails ref="documentPages" v-if="!editMode" />
      <ScrollingDocument class="dashboard-document" ref="scrollingDocument" />
      <DocumentAnnotations ref="annotations" v-if="!editMode" />
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
    <div class="not-supported" v-if="!isMinimumWidth">
      <div class="text">{{ $t("resolution_not_supported") }}</div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
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
    ...mapState("display", [
      "scale",
      "fit",
      "optimalResolution",
      "pageWidthScale"
    ]),
    ...mapState("document", [
      "showError",
      "showDocumentError",
      "errorMessageWidth",
      "selectedDocument"
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("document", ["defaultPageSize"]),
    ...mapGetters("display", ["isMinimumWidth"]),
    elementsWidth() {
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
      return elementsWidth;
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.onDocumentResize);
  },
  destroyed() {
    if (this.$refs.scrollingDocument) {
      this.resizeObserver.unobserve(this.$refs.scrollingDocument.$el);
    }
  },
  data() {
    return {
      resizeObserver: null,
      unwatchSelectedDocument: null
    };
  },
  methods: {
    onDocumentResize() {
      this.$store.dispatch(
        "display/updateOptimalResolution",
        this.$el.offsetWidth
      );
      // TODO: change page size
      this.$store.dispatch("display/updateScale", {
        elementsWidth: this.elementsWidth,
        client: {
          width: this.$el.clientWidth,
          height: this.$el.clientHeight
        },
        viewport: {
          width: this.defaultPageSize[0],
          height: this.defaultPageSize[1]
        }
      });
    }
  },
  watch: {
    selectedDocument(newDocument, oldDocument) {
      if (newDocument && !oldDocument) {
        // first time
        this.resizeObserver.observe(this.$refs.scrollingDocument.$el);
      } else if (newDocument) {
        this.onDocumentResize();
      }
    }
  }
};
</script>
