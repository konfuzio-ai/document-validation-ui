<script>
import { mapState } from "vuex";
import { PIXEL_RATIO } from "./constants";

export default {
  name: "ScrollingPage",

  props: {
    page: {
      type: Object, // instance of PDFPageProxy returned from pdf.getPage
      required: true
    },
    focusedPage: {
      type: Number,
      default: undefined
    },
    scrollTop: {
      type: Number,
      default: 0
    },
    clientHeight: {
      type: Number,
      default: 0
    },
    enablePageJump: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      elementTop: 0,
      elementHeight: 0
    };
  },

  computed: {
    isPageFocused() {
      return this.page.pageNumber === this.focusedPage;
    },

    isElementFocused() {
      const {
        elementTop,
        bottom,
        elementHeight,
        scrollTop,
        clientHeight
      } = this;
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
    ...mapState("document", ["focusedAnnotation"])
  },

  methods: {
    jumpToPage() {
      if (!this.enablePageJump || this.isElementFocused || !this.isPageFocused)
        return;

      this.$emit("page-jump", this.elementTop);
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
      return (
        (bbox.top *
          this.scale *
          (this.page.size[0] / this.page.original_size[0])) /
        PIXEL_RATIO
      );
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
    isPageFocused: "jumpToPage",

    /**
     * Scroll to the focused annotation if it changes and it's on this page.
     */
    focusedAnnotation(focused) {
      if (
        (focused.scroll === "page" || focused.scroll === "both") &&
        focused.pageNumber === this.page.pageNumber
      ) {
        // We wait for the page to be focused before actually scrolling
        // to the focused annotation.
        this.$nextTick(() => {
          this.scrollTo(this.getYForBbox(focused.bboxes[0]));
        });
      }
    }
  },

  created() {
    this.$on("update-visibility", this.updateElementBounds);
  },

  mounted() {
    this.updateElementBounds();
  },

  render() {
    const { isPageFocused, isElementFocused } = this;
    return this.$scopedSlots.default({
      isPageFocused,
      isElementFocused
    });
  }
};
</script>
