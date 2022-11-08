<template>
  <div>
    <DocumentPage v-if="editMode" :page="page" />
    <DummyPage v-else-if="!loadedPage || !pageInVisibleRange(page)" />
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
    DummyPage
  },

  props: {
    page: {
      type: Object,
      required: true
    },
    scrollTop: {
      type: Number,
      required: true
    },
    clientHeight: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      elementTop: 0,
      elementHeight: 0,
      previousFocusedAnnotation: null,
      previousY: null
    };
  },

  computed: {
    ...mapGetters("display", ["visiblePageRange", "bboxToRect"]),

    loadedPage() {
      let loadedPage = null;
      if (this.page && this.pages) {
        loadedPage = this.pages.find(p => p.number === this.page.number);
      }
      if (!loadedPage && this.pageInVisibleRange(this.page)) {
        this.loadPage();
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

    ...mapState("display", ["scale", "currentPage"]),
    ...mapState("document", ["documentFocusedAnnotation", "pages"]),
    ...mapState("edit", ["editMode"])
  },

  methods: {
    loadPage() {
      return this.$store.dispatch(
        "document/fetchDocumentPage",
        this.page.number
      );
    },
    changePage(pageNumber) {
      if (pageNumber !== this.currentPage) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    },
    pageInVisibleRange(page) {
      let number;
      if (this.editMode) {
        number = page.page_number;
      } else {
        number = page.number;
      }
      return this.visiblePageRange.includes(number);
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
      return this.bboxToRect(this.loadedPage, bbox).y;
    },

    /**
     * Scroll to a relative position in the page. It gets added
     * the page's element top and a padding margin.
     */
    scrollTo(y) {
      this.$emit("page-jump", this.elementTop + y - 80);
    }
  },

  watch: {
    scrollTop: "updateElementBounds",
    clientHeight: "updateElementBounds",

    /**
     * Scroll to the focused annotation if it changes and it's on this page.
     */
    async documentFocusedAnnotation(newValue) {
      const focusedAnn = newValue.annotation;
      const scroll = newValue.scroll;
      if (
        scroll &&
        focusedAnn &&
        focusedAnn.span &&
        focusedAnn.span[0].page_index + 1 === this.page.number
      ) {
        // We wait for the page to be focused before actually scrolling
        // to the focused annotation.

        // load page first if not loaded
        // TODO: this should be removed once we have the size on page property from document
        if (!this.loadedPage) {
          await this.loadPage();
        }

        this.$nextTick(() => {
          // Scroll to the annotation
          this.scrollTo(this.getYForBbox(focusedAnn.span[0]));
        });
      }
    },
    isElementFocused(focused) {
      if (focused) {
        let pageNumber;
        if (this.editMode) {
          pageNumber = this.page.page_number;
        } else {
          pageNumber = this.page.number;
        }
        this.$store.dispatch("display/updateCurrentPage", pageNumber);
      }
    },
    currentPage(number) {
      if (
        (this.page.number === number || this.page.page_number === number) &&
        !this.isElementFocused
      ) {
        this.$emit("page-jump", this.elementTop);
      }
    }
  },

  created() {
    this.$on("update-visibility", this.updateElementBounds);
  },

  mounted() {
    this.updateElementBounds();
  }
};
</script>
