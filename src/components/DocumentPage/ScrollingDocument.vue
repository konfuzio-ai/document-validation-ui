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
  >
    <div :class="[recalculatingAnnotations && 'blur']">
      <ScrollingPage
        v-for="page in pages"
        :key="page.number"
        :page="page"
        :clientHeight="clientHeight"
        :scrollTop="scrollTop"
        @page-jump="onPageJump"
        class="scrolling-page"
        :scroll="scroll"
      />
    </div>
    <Toolbar v-if="pages && pages.length > 0" />
  </div>
</template>

<script>
import { mapState } from "vuex";
import scroll from "../../directives/scroll";
import ScrollingPage from "./ScrollingPage";
import Toolbar from "../DocumentPage/DocumentToolbar";

export default {
  components: {
    ScrollingPage,
    Toolbar
  },

  directives: {
    scroll
  },

  props: {
    scroll: {
      type: Boolean
    }
  },

  data() {
    return {
      scrollTop: 0,
      clientHeight: 0
    };
  },

  computed: {
    ...mapState("document", ["recalculatingAnnotations", "pages"])
  },

  methods: {
    updateScrollBounds() {
      const { scrollTop, clientHeight } = this.$el;
      this.scrollTop = scrollTop;
      this.clientHeight = clientHeight;
    },
    /**
     * Scrolls the ScrollingDocument to the offset specified by scrollTop
     * (i.e., another page).
     */
    onPageJump(scrollTop) {
      const actualScroll = scrollTop;
      this.$refs.scrollingDocument.scrollTop =
        // the 4 comes from the margin between pages
        actualScroll - (this.$refs.scrollingDocument.offsetTop + 4);
    }
  },
  watch: {
    pages(pages) {
      // if pages change
      if (pages.length > 0) {
        this.$emit("pages-reset");
      }
    }
  }
};
</script>
