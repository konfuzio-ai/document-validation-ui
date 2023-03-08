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
          v-for="page in editMode ? documentPagesListForEditMode : pages"
          :key="page.number"
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
  </div>
</template>
<script>
import { mapState } from "vuex";
import scroll from "../../directives/scroll";
import ScrollingPage from "./ScrollingPage";
import Toolbar from "./DocumentToolbar";
import ActionBar from "./ActionBar";

export default {
  components: {
    ScrollingPage,
    Toolbar,
    ActionBar,
  },
  directives: {
    scroll,
  },

  data() {
    return {
      scrollTop: 0,
      clientHeight: 0,
    };
  },

  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "selectedDocument",
      "loading",
    ]),
    ...mapState("edit", ["editMode", "documentPagesListForEditMode"]),
    ...mapState("display", ["scale", "documentActionBar"]),

    pages() {
      if (this.selectedDocument) {
        return this.selectedDocument.pages;
      } else {
        return [];
      }
    },
    showToolbar() {
      return this.pages.length > 0 && this.scale && !this.documentActionBar;
    },
    showActionBar() {
      return this.documentActionBar !== null;
    },
  },
  watch: {
    loading() {
      this.scrollTop = 0;
    },
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
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
