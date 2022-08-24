<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="edit-pages">
    <div :class="[scroll && 'scroll']">
      <draggable
        v-model="pagesArray"
        :class="['document-grid']"
        easing="cubic-bezier(0.37, 0, 0.63, 1)"
        @start="dragging = true"
        @end="handleDragEnd"
        :move="checkMove"
      >
        <div
          v-for="(page, index) in pagesArray"
          :key="page.id"
          :class="['image-section']"
        >
          <div class="image-container" @click="handlePageChange(page.number)">
            <div class="thumbnail" @click="selectPage(page.number)">
              <div
                :class="[
                  'img-container',
                  isPageSelected(page.number) === page.number && 'selected'
                ]"
                :style="{
                  transform: 'rotate(' + getRotation(page.id) + 'deg)'
                }"
              >
                <ServerImage
                  :class="['img-thumbnail']"
                  :imageUrl="`${page.thumbnail_url}?${page.updated_at}`"
                />
              </div>
              <div class="icon-container">
                <div class="action-icon">
                  <b-icon
                    icon="eye"
                    class="is-small"
                    @click="handlePageChange(page.number)"
                  />
                </div>
              </div>
            </div>
            <span class="page-number">{{ page.number }}</span>
          </div>
          <div
            :class="[
              'splitting-lines',
              activeSplittingLines[index] === page.number && 'active-split'
            ]"
            @click="handleSplittingLines(page)"
          >
            <div class="scissors-icon">
              <b-icon icon="scissors" class="is-small" />
            </div>
            <div v-if="activeSplittingLines[index] === page.number">
              <SplitDivider />
            </div>
          </div>
        </div>
      </draggable>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import SplitDivider from "../../assets/images/SplitDivider";
import draggable from "vuedraggable";
import { is } from "@babel/types";

export default {
  name: "EditPages",
  components: {
    ServerImage,
    SplitDivider,
    draggable
  },
  props: {
    pagesArray: {
      type: Array
    },
    activeSplittingLines: {
      type: Array
    },
    scroll: {
      type: Boolean
    }
  },
  computed: {
    ...mapState("document", [
      "pages",
      "recalculatingAnnotations",
      "selectedDocument"
    ]),
    ...mapState("edit", [
      "editMode",
      "rotations",
      "rotationsForBackend",
      "splitOverview",
      "selectedPages"
    ])
  },
  methods: {
    handlePageChange(pageNumber) {
      this.$emit("change-page", pageNumber);
    },
    isPageSelected(pageNumber) {
      const page = this.selectedPages.find(page => page === pageNumber);
      return page;
    },
    selectPage(pageNumber) {
      this.$store.dispatch("edit/setSelectedPages", pageNumber);
    },
    getRotation(pageId) {
      // rotate page
      return this.rotations?.find(rotation => rotation.id === pageId)?.angle;
    },
    handleSplittingLines(page) {
      this.$emit("handle-splitting-lines", page);
    },
    checkMove(event) {
      this.$emit("check-move", event);
    },
    handleDragEnd() {
      this.draggable = false;

      this.$emit("handle-drag-end");
    }
  }
};
</script>
