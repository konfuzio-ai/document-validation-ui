<template>
  <div class="dashboard">
    <DocumentTopBar />
    <div :class="['dashboard-viewer', splitOverview ? 'edit-mode' : '']">
      <DocumentThumbnails v-if="!editMode" ref="documentPages" />
      <ScrollingDocument ref="scrollingDocument" class="dashboard-document" />
      <DocumentAnnotations v-if="!editMode" ref="annotations" />
      <DocumentEdit v-else ref="editView" />

      <MultiAnnotationTableOverlay
        v-if="showAnnSetTable"
        :left="documentContainerLeftPadding"
        :width="documentContainerWidth"
      />

      <transition name="slide-fade">
        <div
          v-if="showActionError"
          class="error-message"
          :style="{ width: `${errorMessageWidth}px` }"
        >
          <ErrorMessage />
        </div>
      </transition>
    </div>
    <div v-if="showDocumentError" class="error-modal">
      <DocumentErrorModal />
    </div>
    <div v-if="!optimalResolution" class="not-optimized">
      <NotOptimizedViewportModal />
    </div>
    <div v-if="!isMinimumWidth" class="not-supported">
      <div class="text">
        {{ $t("resolution_not_supported") }}
      </div>
    </div>
    <div
      v-if="
        selectedDocument && waitingForSplittingConfirmation(selectedDocument)
      "
    >
      <SplittingSuggestionsModal />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import { DocumentTopBar } from "./DocumentTopBar";
import { ScrollingDocument } from "./DocumentPage";
import { DocumentThumbnails } from "./DocumentThumbnails";
import {
  DocumentAnnotations,
  MultiAnnotationTableOverlay,
} from "./DocumentAnnotations";
import { DocumentEdit } from "./DocumentEdit";
import ErrorMessage from "./ErrorMessage";
import NotOptimizedViewportModal from "../components/DocumentModals/NotOptimizedViewportModal";
import DocumentErrorModal from "../components/DocumentModals/DocumentErrorModal";
import SplittingSuggestionsModal from "../components/DocumentModals/SplittingSuggestionsModal";

/**
 * This component shows the PDF pages in a scrolling component and
 * the annotations on the side.
 */
export default {
  name: "DocumentDashboard",
  components: {
    DocumentTopBar,
    ScrollingDocument,
    DocumentThumbnails,
    DocumentAnnotations,
    DocumentEdit,
    ErrorMessage,
    NotOptimizedViewportModal,
    DocumentErrorModal,
    SplittingSuggestionsModal,
    MultiAnnotationTableOverlay,
  },
  data() {
    return {
      resizeObserver: null,
      unwatchSelectedDocument: null,
      documentContainerLeftPadding: 0,
      documentContainerWidth: 0,
    };
  },
  computed: {
    ...mapState("display", [
      "scale",
      "fit",
      "optimalResolution",
      "pageWidthScale",
      "currentPage",
      "showAnnSetTable",
    ]),
    ...mapState("document", [
      "showActionError",
      "showDocumentError",
      "errorMessageWidth",
      "selectedDocument",
      "splittingSuggestions",
    ]),
    ...mapState("edit", ["editMode", "splitOverview"]),
    ...mapGetters("display", ["isMinimumWidth"]),
    ...mapGetters("document", ["waitingForSplittingConfirmation"]),
  },
  watch: {
    selectedDocument(newDocument, oldDocument) {
      if (newDocument && !oldDocument) {
        // first time
        this.resizeObserver.observe(this.$refs.scrollingDocument.$el);
      } else if (newDocument) {
        this.onDocumentResize();
      }
    },
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.onDocumentResize);
  },
  destroyed() {
    if (this.$refs.scrollingDocument) {
      this.resizeObserver.unobserve(this.$refs.scrollingDocument.$el);
    }
  },
  methods: {
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
    },
    onDocumentResize() {
      this.documentContainerLeftPadding =
        this.$refs.scrollingDocument.$el.getBoundingClientRect().left;
      this.documentContainerWidth =
        this.$refs.scrollingDocument.$el.offsetWidth;
      this.$store.dispatch(
        "display/updateOptimalResolution",
        this.$el.offsetWidth
      );
      if (this.selectedDocument.pages[0]) {
        this.$store.dispatch("display/updateScale", {
          elementsWidth: this.elementsWidth(),
          client: {
            width: this.$el.clientWidth,
            height: this.$el.clientHeight,
          },
          viewport: {
            width: this.selectedDocument.pages[0].size[0],
            height: this.selectedDocument.pages[0].size[1],
          },
        });
      }
    },
  },
};
</script>
<style scoped lang="scss" src="../assets/scss/document_dashboard.scss"></style>
