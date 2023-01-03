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
    <Toolbar
      v-if="pages.length > 0 && scale && !creatingMultipleAnnotationSets"
    />
    <ActionBar
      v-if="creatingMultipleAnnotationSets"
      :has-icon="hasIcon"
      :icon="icon"
      :text="text"
      :has-button="hasButton"
    />
  </div>
</template>
<script>
import { mapState } from "vuex";
import scroll from "../../directives/scroll";
import ScrollingPage from "./ScrollingPage";
import Toolbar from "../DocumentPage/DocumentToolbar";
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
      hasIcon: true,
      icon: "grid",
      text: "This is an action bar",
      hasButton: true,
      creatingMultipleAnnotationSets: true, // TODO: move to store & set dynamically when more features implemented
    };
  },

  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "selectedDocument",
      "loading",
      "publicView",
    ]),
    ...mapState("edit", ["editMode", "documentPagesListForEditMode"]),
    ...mapState("display", ["scale"]),

    pages() {
      if (this.selectedDocument) {
        return this.selectedDocument.pages;
      } else {
        return [];
      }
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
     * Scrolls the ScrollingDocument to the offset specified by scrollTop
     * (i.e., another page).
     */
    onPageJump(scrollTop) {
      const actualScroll = scrollTop;
      this.$refs.scrollingDocument.scrollTop =
        // the 4 comes from the margin between pages
        actualScroll - (this.$refs.scrollingDocument.offsetTop + 4);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
