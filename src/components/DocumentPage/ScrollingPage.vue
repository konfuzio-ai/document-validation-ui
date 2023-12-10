<template>
  <div>
    <DummyPage
      v-if="!loadedPage || !pageInVisibleRange(page)"
      :width="page.size[0]"
      :height="page.size[1]"
    />
    <DocumentPage v-else :page="loadedPage" />
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import DocumentPage from "../DocumentPage/DocumentPage";
import DummyPage from "../DocumentPage/DummyPage";

export default {
  name: "ScrollingPage",

  components: {
    DocumentPage,
    DummyPage,
  },

  props: {
    page: {
      type: Object,
      required: true,
    },
    scrollTop: {
      type: Number,
      required: true,
    },
    clientHeight: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      elementTop: 0,
      elementHeight: 0,
      previousFocusedAnnotation: null,
      previousY: null,
      pageBeingLoaded: false,
      isScrolling: false,
    };
  },

  computed: {
    ...mapState("display", ["pageChangedFromThumbnail", "currentPage"]),
    ...mapState("document", ["pages", "documentAnnotationSelected", "loading"]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("display", ["visiblePageRange", "bboxToRect"]),
    ...mapGetters("document", ["scrollDocumentToAnnotation"]),

    loadedPage() {
      if (this.editMode) {
        return this.page;
      }
      let loadedPage = null;
      if (this.page && this.pages) {
        loadedPage = this.pages.find((p) => p.number === this.page.number);
      }
      if (!loadedPage && this.pageInVisibleRange(this.page)) {
        if (!this.pageBeingLoaded) {
          this.loadPage();
        }
      }
      return loadedPage;
    },

    isElementFocused() {
      const { elementTop, bottom, elementHeight, scrollTop, clientHeight } =
        this;
      if (!elementHeight) return;

      const halfHeight = elementHeight / 2;
      const halfScreen = clientHeight / 2;
      const delta = elementHeight >= halfScreen ? halfScreen : halfHeight;
      const threshold = scrollTop + delta;

      return elementTop < threshold && bottom >= threshold;
    },

    bottom() {
      return this.elementTop + this.elementHeight;
    },

    scrollBottom() {
      return this.scrollTop + this.clientHeight;
    },

    currentSearchResultForPage() {
      return this.$store.getters["display/currentSearchResultForPage"](
        this.page.number
      );
    },
  },

  watch: {
    scrollTop: "updateElementBounds",
    clientHeight: "updateElementBounds",

    /**
     * Scroll to the focused annotation if it changes and it's on this page.
     */
    scrollDocumentToAnnotation(isToScroll) {
      if (
        isToScroll &&
        this.documentAnnotationSelected.page === this.page.number
      ) {
        // We wait for the page to be focused before actually scrolling
        // to the focused annotation.
        this.$nextTick(() => {
          // Scroll to the annotation
          this.scrollTo(
            this.getYForBbox(this.documentAnnotationSelected.span) - 100, // offset for edit annotation popup
            this.getXForBbox(this.documentAnnotationSelected.span)
          );
        });
      }
    },
    isElementFocused(focused) {
      if (!this.loading && focused && !this.pageChangedFromThumbnail) {
        this.$store.dispatch("display/updateCurrentPage", this.page.number);
      }
    },
    currentPage(number) {
      if (this.page.number === number && !this.isElementFocused) {
        this.$emit("page-jump", this.elementTop, 0);
      }
    },
    /**
     * Scroll to the search result if the current one changes and it's on this page.
     */
    currentSearchResultForPage(res) {
      // skip page jump if the result is null (the current search result is not on this page)
      if (!res) {
        return;
      }
      const y = this.getYForBbox(res); // y of the search result
      const totalY = y + this.elementTop; // y of search result + page top
      // skip page jump if the search result is already visible on this page
      if (totalY < this.scrollBottom && totalY > this.scrollTop) {
        return;
      }
      this.$nextTick(function () {
        this.scrollTo(y);
      });
    },
  },
  mounted() {
    this.updateElementBounds();
  },

  methods: {
    loadPage() {
      this.pageBeingLoaded = true;
      this.$store
        .dispatch("document/fetchDocumentPage", this.page.number)
        .then(() => {
          this.pageBeingLoaded = false;
        });
    },
    pageInVisibleRange(page) {
      return (
        this.currentPage === page.number ||
        this.visiblePageRange.includes(page.number)
      );
    },
    updateElementBounds() {
      const { offsetTop, offsetHeight } = this.$el;
      this.elementTop = offsetTop;
      this.elementHeight = offsetHeight;
    },

    /**
     * Calculate the y-position of this bbox on the page
     * from its top, the scale and the image scale (calculated
     * from the page object).
     */
    getYForBbox(bbox) {
      return this.bboxToRect(this.page, bbox).y;
    },

    getXForBbox(bbox) {
      return this.bboxToRect(this.page, bbox).x;
    },

    /**
     * Scroll to a relative position in the page. It gets added
     * the page's element top and a padding margin.
     */
    scrollTo(y, x) {
      this.$emit("page-jump", this.elementTop + y - 80, x);
    },
  },
};
</script>
