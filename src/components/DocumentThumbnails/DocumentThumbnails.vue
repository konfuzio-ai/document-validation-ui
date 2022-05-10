<style scoped lang="scss">
.document-pages {
  background: $background;
  min-width: 80px;
  overflow-y: auto;
  font-family: "Inter", sans-serif;
  height: calc(100vh - $header-size);

  .document-thumbnail {
    text-align: center;
    padding: 16px 0;
    margin: 0 8px 16px 8px;
    cursor: pointer;

    .img-thumbnail.selected {
      outline: 2px solid $dark;
    }
    .img-thumbnail {
      width: 40px;
      text-align: center;
    }

    .number-thumbnail {
      color: $text;
      font-size: 12px;
      margin-top: 4px;
    }
  }
}
</style>
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
        :src="page.image"
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
