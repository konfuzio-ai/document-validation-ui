<template>
  <div>
    <DocumentPage
      v-if="editMode"
      :page="page"
    />
    <DummyPage
      v-else-if="!loadedPage || !pageInVisibleRange(page)"
      :width="page.size[0]"
      :height="page.size[1]"
    />
    <DocumentPage
      v-else
      :page="loadedPage"
    />
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
      previousY: null,
      pageBeingLoaded: false
    };
  },

  computed: {
    ...mapGetters("display", ["visiblePageRange", "bboxToRect"]),
    ...mapGetters("document", ["scrollDocumentToAnnotation"]),

    loadedPage() {
      let loadedPage = null;
      if (this.page && this.pages) {
        loadedPage = this.pages.find(p => p.number === this.page.number);
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

    ...mapState("display", ["scale", "currentPage"]),
    ...mapState("document", ["pages", "documentAnnotationSelected", "loading"]),
    ...mapState("edit", ["editMode"])
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
          this.scrollTo(this.getYForBbox(this.documentAnnotationSelected.span));
        });
      }
    },
    isElementFocused(focused) {
      if (!this.loading && focused) {
        let pageNumber;

        // TODO: have the same name for page.number in the edit mode so there's no need to do this validations
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
      let number;
      if (this.editMode) {
        number = page.page_number;
      } else {
        number = page.number;
      }
      return (
        this.currentPage === number || this.visiblePageRange.includes(number)
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

    /**
     * Scroll to a relative position in the page. It gets added
     * the page's element top and a padding margin.
     */
    scrollTo(y) {
      this.$emit("page-jump", this.elementTop + y - 80);
    }
  }
};
</script>
