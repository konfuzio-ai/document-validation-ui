<template>
  <div>
    <div
      ref="scrollingDocument"
      v-scroll.immediate="updateScrollBounds"
      class="scrolling-document"
    >
      <div
        v-if="
          selectedDocument && scale && !loading && !recalculatingAnnotations
        "
      >
        <ScrollingPage
          v-for="page in editMode ? pagesForPostprocess : pages"
          :key="page.number"
          ref="scrollingPage"
          :page="page"
          :client-height="clientHeight"
          :scroll-top="scrollTop"
          class="scrolling-page"
          @page-jump="onPageJump"
        />
      </div>
      <div v-else class="loading-page">
        <b-skeleton width="100%" height="1000px" />
      </div>
    </div>
    <Toolbar v-if="showToolbar" />
    <ActionBar v-if="showActionBar" />
    <MultiAnnotationTableOverlay
      v-if="testAnnotationsSets && false"
      :annotations-sets="testAnnotationsSets"
    />
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import scroll from "../../directives/scroll";
import ScrollingPage from "./ScrollingPage";
import Toolbar from "./DocumentToolbar";
import ActionBar from "./ActionBar";
import MultiAnnotationTableOverlay from "./MultiAnnotationTableOverlay";

export default {
  components: {
    ScrollingPage,
    Toolbar,
    ActionBar,
    MultiAnnotationTableOverlay,
  },
  directives: {
    scroll,
  },

  data() {
    return {
      scrollTop: 0,
      clientHeight: 0,
      isScolling: false,
      scrollTimeout: null,
    };
  },

  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "selectedDocument",
      "loading",
      "annotationSets",
    ]),
    ...mapState("edit", [
      "editMode",
      "documentPagesListForEditMode",
      "pagesForPostprocess",
    ]),
    ...mapState("display", [
      "scale",
      "documentActionBar",
      "pageChangedFromThumbnail",
      "currentPage",
    ]),
    ...mapGetters("display", ["visiblePageRange"]),

    pages() {
      if (this.selectedDocument) {
        return this.selectedDocument.pages;
      } else {
        return [];
      }
    },
    showToolbar() {
      return (
        !this.loading &&
        this.pages.length > 0 &&
        this.scale &&
        !this.documentActionBar
      );
    },
    showActionBar() {
      return this.documentActionBar !== null;
    },
  },
  watch: {
    loading() {
      this.scrollTop = 0;
    },
    annotationSets(newValue) {
      if (newValue) {
        this.testAnnotationsSets = [
          this.$store.state.document.annotationSets[3],
          this.$store.state.document.annotationSets[4],
          this.$store.state.document.annotationSets[5],
          this.$store.state.document.annotationSets[6],
          this.$store.state.document.annotationSets[7],
        ];
        console.log(this.testAnnotationsSets);
      }
    },
  },
  mounted() {
    this.$refs.scrollingDocument.addEventListener("scroll", this.handleScroll);
  },

  methods: {
    updateScrollBounds() {
      const { scrollTop, clientHeight } = this.$refs.scrollingDocument;
      this.scrollTop = scrollTop;
      this.clientHeight = clientHeight;
    },
    /**
     * Scrolls the ScrollingDocument to the offset specified by scrollTop & scrollLeft (if zoomed in)
     * (i.e., another page).
     */
    onPageJump(scrollTop, scrollLeft) {
      const scrollY = scrollTop - (this.$refs.scrollingDocument.offsetTop + 4); // + 4 due to margin between pages
      const scrollX = scrollLeft - this.$refs.scrollingDocument.offsetLeft - 4; // - 4 to add more space before the entity

      this.$refs.scrollingDocument.scroll(scrollX, scrollY);
    },
    handleScroll() {
      if (this.pages.length === 1) return;

      this.isScrolling = true;

      clearTimeout(this.scrollTimeout);

      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;

        if (
          this.pageChangedFromThumbnail &&
          this.visiblePageRange[1] === this.currentPage
        ) {
          this.$store.dispatch("display/setPageChangedFromThumbnail", false);
        }
      }, 300);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
