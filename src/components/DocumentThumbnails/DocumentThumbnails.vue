<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
<template>
  <div class="document-pages">
    <div v-if="selectedDocument">
      <div
        :class="[
          'document-thumbnail',
          currentPage == page.number && 'selected'
        ]"
        v-for="page in selectedDocument.pages"
        v-bind:key="page.id"
        v-on:click="changePage(page.number)"
      >
        <div class="image-section">
          <div class="image-container">
            <ServerImage
              :class="[
                'img-thumbnail',
                currentPage == page.number && 'selected',
                recalculatingAnnotations && 'blur'
              ]"
              :width="'40px'"
              :imageUrl="page.thumbnail_url"
            >
              <LoadingThumbnail />
            </ServerImage>
          </div>
        </div>
        <div class="number-thumbnail">{{ page.number }}</div>
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
    LoadingThumbnail
  },
  computed: {
    ...mapState("document", ["selectedDocument", "recalculatingAnnotations"]),
    ...mapState("display", ["currentPage"])
  },
  methods: {
    /* Change page if not the currently open and not in modal */
    changePage(pageNumber) {
      if (pageNumber != this.currentPage) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    }
  }
};
</script>
