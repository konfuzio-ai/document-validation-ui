<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
<template>
  <div
    class="scrolling-document"
    v-scroll.immediate="updateScrollBounds"
    id="scrollingDocument"
  >
    <div :class="[recalculatingAnnotations && 'blur']">
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
    </div>
    <Toolbar v-if="!editMode" />
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
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
    ...mapGetters("selection", ["isSelectionEnabled"]),
    ...mapState("document", ["recalculatingAnnotations"]),
    ...mapState("edit", ["editMode"])
  },

  methods: {
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
