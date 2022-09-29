<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
<template>
  <div :class="['document-pages', !imageLoaded && 'loading-pages']">
    <div class="skeleton-section" v-if="!imageLoaded">
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
      <LoadingThumbnails />
    </div>

    <div>
      <div
        :class="[
          'document-thumbnail',
          currentPage == page.number && 'selected',
          !imageLoaded && 'hidden'
        ]"
        v-for="page in pages"
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
              :imageUrl="`${page.thumbnail_url}?${page.updated_at}`"
            />
          </div>
        </div>
        <div class="number-thumbnail">{{ page.number }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import LoadingThumbnails from "./LoadingThumbnails.vue";

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
    LoadingThumbnails
  },
  computed: {
    ...mapState("document", [
      "pages",
      "recalculatingAnnotations",
      "imageLoaded"
    ]),
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
