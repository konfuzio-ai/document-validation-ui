<template>
  <div ref="documentThumbnails" class="document-pages">
    <div v-if="selectedDocument">
      <div
        v-for="page in selectedDocument.pages"
        ref="docPage"
        :key="page.id"
        :class="[
          'document-thumbnail',
          currentPage == page.number && 'selected',
        ]"
        @click="changePage(page.number)"
      >
        <div class="image-section">
          <div class="image-container">
            <ServerImage
              v-if="!loading && !recalculatingAnnotations"
              :class="[
                'img-thumbnail',
                currentPage == page.number && 'selected',
              ]"
              :width="'40px'"
              :image-url="`${page.thumbnail_url}?${selectedDocument.downloaded_at}`"
            >
              <LoadingThumbnail />
            </ServerImage>
            <LoadingThumbnail v-else />
          </div>
        </div>
        <div class="number-thumbnail">
          {{ page.number }}
        </div>
      </div>
    </div>
    <div v-else>
      <div class="document-thumbnail">
        <div class="image-section">
          <div class="image-container">
            <LoadingThumbnail />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import LoadingThumbnail from "./LoadingThumbnail.vue";

/**
 * This component creates a vertical list of the document pages
 * with thumbnail pictures of it which are also clickable.
 * It also creates a grid list of the pages in the toolbar modal
 * to allow the user to rotate them.
 */
export default {
  name: "DocumentThumbnails",
  components: {
    ServerImage,
    LoadingThumbnail,
  },
  data() {
    return {
      thumbnailClicked: false,
      previousScrollPosition: 0,
    };
  },
  computed: {
    ...mapState("document", [
      "selectedDocument",
      "recalculatingAnnotations",
      "loading",
    ]),
    ...mapState("display", ["currentPage"]),
  },
  watch: {
    currentPage(newPage) {
      if (newPage && !this.thumbnailClicked) {
        this.scrollToThumbnail();
      }
    },
  },
  mounted() {
    const scrollingPage = document.querySelector(".scrolling-document");

    if (scrollingPage) {
      scrollingPage.addEventListener("scroll", () => {
        this.scrollToThumbnail();
      });
    }
  },

  methods: {
    /* Change page if not the currently open and not in modal */
    changePage(pageNumber) {
      this.thumbnailClicked = true;

      if (
        !this.loading &&
        !this.recalculatingAnnotations &&
        pageNumber != this.currentPage
      ) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    },

    scrollToThumbnail() {
      // select only the active thumbnail
      const selectedPage = this.$refs.docPage.filter((image) =>
        image.className.includes("selected")
      );

      if (selectedPage && selectedPage[0]) {
        selectedPage[0].scrollIntoView();
      }
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
