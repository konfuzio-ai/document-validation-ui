<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
<template>
  <div>
    <div
      class="scrolling-document"
      v-scroll.immediate="updateScrollBounds"
      ref="scrollingDocument"
    >
      <div
        v-if="
          selectedDocument && scale && !loading && !recalculatingAnnotations
        "
      >
        <ScrollingPage
          v-for="page in editMode ? pagesArray : pages"
          :key="page.number"
          :page="page"
          :clientHeight="clientHeight"
          :scrollTop="scrollTop"
          @page-jump="onPageJump"
          class="scrolling-page"
        />
      </div>
      <div class="loading-page" v-else>
        <b-skeleton width="100%" height="1000px" />
      </div>
    </div>
    <Toolbar v-if="!editMode && pages.length > 0 && scale" />
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

  data() {
    return {
      scrollTop: 0,
      clientHeight: 0
    };
  },

  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "selectedDocument",
      "loading"
    ]),
    ...mapState("edit", ["editMode", "pagesArray"]),
    ...mapState("display", ["scale"]),

    pages() {
      if (this.selectedDocument) {
        return this.selectedDocument.pages;
      } else {
        return [];
      }
    }
  },

  methods: {
    updateScrollBounds() {
      const { scrollTop, clientHeight } = this.$refs.scrollingDocument;
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
    loading() {
      this.scrollTop = 0;
    }
  }
};
</script>
