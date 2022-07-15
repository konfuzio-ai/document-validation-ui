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
        <div class="image-container">
          <div class="thumbnail">
            <ServerImage
              class="img-thumbnail"
              :imageUrl="`${page.thumbnail_url}?${page.updated_at}`"
            />
            <div class="icon-container">
              <div class="action-icon">
                <b-icon icon="eye" class="is-small" />
              </div>
              <div class="action-icon" v-if="editMode === editOptions.rotate">
                <b-icon icon="arrow-rotate-left" class="is-small" />
              </div>
            </div>
          </div>
          <span class="page-number">{{ index + 1 }}</span>
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
    ...mapState("document", ["pages", "editMode", "editOptions"])
  },
  methods: {}
};
</script>
