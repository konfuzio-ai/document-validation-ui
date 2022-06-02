<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
<template>
  <div
    class="scrolling-document"
    v-scroll.immediate="updateScrollBounds"
    ref="scrollingDocument"
    @mousemove="documentMouseMove"
    @mouseleave="documentMouseLeave"
  >
    <ScrollingPage
      v-for="page in pages"
      :key="page.pageNumber"
      v-bind="{
        page,
        clientHeight,
        scrollTop,
        focusedPage,
        enablePageJump
      }"
      v-slot="{ isPageFocused, isElementFocused }"
      @page-jump="onPageJump"
    >
      <div class="scrolling-page">
        <slot v-bind="{ page, isPageFocused, isElementFocused }"></slot>
      </div>
    </ScrollingPage>
    <div class="cursor" ref="cursor" v-if="editingAnnotation">
      <div class="cursor-lines">
        <div class="vt" ref="vt"></div>
        <div class="hl"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import scroll from "../../directives/scroll";
import ScrollingPage from "./ScrollingPage";

export default {
  components: {
    ScrollingPage
  },

  directives: {
    scroll
  },

  props: {
    pages: {
      required: true
    },
    enablePageJump: {
      type: Boolean,
      default: false
    },
    isParentVisible: {
      default: true
    }
  },

  data() {
    return {
      focusedPage: undefined,
      scrollTop: 0,
      clientHeight: 0
    };
  },

  computed: {
    pagesLength() {
      return this.$store.getters["document/pageCount"];
    },
    ...mapState("display", ["currentPage"]),
    ...mapState("document", ["editingAnnotation"])
  },

  methods: {
    documentMouseMove(e) {
      var rect = this.$refs.scrollingDocument.getBoundingClientRect();
      var x = e.clientX + this.$refs.scrollingDocument.scrollLeft - rect.left;
      var y = e.clientY + this.$refs.scrollingDocument.scrollTop - rect.top;
      this.$refs.cursor.setAttribute(
        "style",
        "top: " + y + "px; left: " + x + "px;"
      );

      // const top = e.clientY * 2;
      // const height = (this.$refs.scrollingDocument.clientHeight - top) * 2;
      // console.log("top", "-" + top);
      // console.log("height", height);
      // this.$refs.vt.setAttribute(
      //   "style",
      //   "top: -" + top + "px; height: " + height + "px;"
      // );
    },
    documentMouseLeave() {
      this.$refs.cursor.removeAttribute("style");
    },
    onPageJump(scrollTop) {
      this.$emit("page-jump", scrollTop);
    },

    updateScrollBounds() {
      const { scrollTop, clientHeight } = this.$el;
      this.scrollTop = scrollTop;
      this.clientHeight = clientHeight;
    }
  },

  watch: {
    isParentVisible: "updateScrollBounds",

    pagesLength(count, oldCount) {
      if (oldCount === 0) this.$emit("pages-reset");

      // Set focusedPage after new pages are mounted
      this.$nextTick(() => {
        this.focusedPage = this.currentPage;
      });
    },

    currentPage(currentPage) {
      if (currentPage > this.pages.length) {
        this.fetchPages(currentPage);
      } else {
        this.focusedPage = currentPage;
      }
    }
  }
};
</script>
