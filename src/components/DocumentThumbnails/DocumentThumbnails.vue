<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
<template>
  <div class="document-pages">
    <div
      :class="['document-thumbnail', currentPage == page.number && 'selected']"
      v-for="page in pages"
      v-bind:key="page.id"
      v-on:click="changePage(page.number)"
    >
      <ServerImage
        :class="['img-thumbnail', currentPage == page.number && 'selected']"
        :imageUrl="page.thumbnail_url"
      />
      <div class="number-thumbnail">{{ page.number }}</div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ServerImage from "../../assets/ServerImage";
/**
 * This component creates a vertical list of the document pages
 * with thumbnail pictures of it which are also clickable.
 */
export default {
  name: "DocumentThumbnails",
  props: {},
  components: {
    ServerImage
  },
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
