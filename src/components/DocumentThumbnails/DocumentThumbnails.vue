<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
<template>
  <div class="document-pages">
    <div
      :class="[
        'document-thumbnail',
        currentPage == page.pageNumber && 'selected'
      ]"
      v-for="page in pages"
      v-bind:key="page.id"
      v-on:click="changePage(page.pageNumber)"
    >
      <img
        :class="['img-thumbnail', currentPage == page.pageNumber && 'selected']"
        :src="page.thumbnail_url"
        alt
      />
      <div class="number-thumbnail">{{ page.pageNumber }}</div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

/**
 * This component creates a vertical list of the document pages
 * with thumbnail pictures of it which are also clickable.
 */
export default {
  name: "DocumentThumbnails",
  props: {},
  computed: {
    ...mapState("document", ["pages"]),
    ...mapState("display", ["currentPage"])
  },
  methods: {
    /* Change page if not the currently open */
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
