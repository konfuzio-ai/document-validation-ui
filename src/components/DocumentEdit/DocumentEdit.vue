<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
<template>
  <div class="document-edit">
    <EditTopBar />
    <div class="document-grid">
      <div
        v-for="(page, index) in pages"
        v-bind:key="index"
        class="image-section"
      >
        <div class="image-container" @click="changePage(page.number)">
          <div class="thumbnail">
            <ServerImage
              class="img-thumbnail"
              :imageUrl="`${page.thumbnail_url}?${page.updated_at}`"
            />
            <div class="icon-container">
              <div class="action-icon">
                <b-icon
                  icon="eye"
                  class="is-small"
                  @click="changePage(page.number)"
                />
              </div>
              <div class="action-icon" v-if="editMode === editOptions.rotate">
                <b-icon icon="arrow-rotate-left" class="is-small" />
              </div>
            </div>
          </div>
          <span class="page-number">{{ page.number }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import EditTopBar from "./EditTopBar";
import ServerImage from "../../assets/images/ServerImage";
/**
 * This component shows a document thumbnail grid view to be able to edit the document.
 */
export default {
  name: "DocumentEdit",
  components: {
    EditTopBar,
    ServerImage
  },
  computed: {
    ...mapState("document", ["pages", "editMode", "editOptions"]),
    ...mapState("display", ["currentPage"])
  },
  methods: {
    changePage(pageNumber) {
      if (pageNumber != this.currentPage && !this.filter) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    }
  }
};
</script>
