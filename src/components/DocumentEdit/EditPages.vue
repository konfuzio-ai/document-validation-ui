<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="edit-pages">
    <div>
      <draggable
        v-model="editPages"
        :class="['document-grid']"
        easing="cubic-bezier(0.37, 0, 0.63, 1)"
        @start="dragging = true"
        @end="handleDragEnd"
        @move="checkMove"
      >
        <div
          v-for="(page, index) in editPages"
          :key="page.id"
          :class="['image-section']"
        >
          <div
            class="image-container"
            @click="handlePageChange(page.page_number)"
          >
            <div class="thumbnail" @click="selectPage(page)">
              <div
                :class="[
                  'img-container',
                  selected && isPageSelected(page.id) === page.id && 'selected'
                ]"
              >
                <ServerImage
                  class="img-thumbnail"
                  :imageUrl="`${page.thumbnail_url}`"
                  :style="{
                    transform: 'rotate(' + getRotation(page.id) + 'deg)'
                  }"
                >
                  <b-skeleton width="57px" height="57px"></b-skeleton>
                </ServerImage>
              </div>
              <div class="icon-container">
                <div class="action-icon">
                  <b-icon
                    icon="eye"
                    class="is-small"
                    @click="handlePageChange(page.page_number)"
                  />
                </div>
              </div>
            </div>
            <span class="page-number">{{ page.page_number }}</span>
          </div>
          <div
            :class="[
              'splitting-lines',
              activeSplittingLines &&
                activeSplittingLines[index] === page.page_number &&
                'active-split'
            ]"
            @click="handleSplittingLines(page)"
          >
            <div class="scissors-icon">
              <b-icon icon="scissors" class="is-small" />
            </div>
            <div
              class="lines"
              v-if="
                activeSplittingLines &&
                activeSplittingLines[index] === page.page_number
              "
            >
              <SplitZigZag />
            </div>
            <div class="lines" v-else>
              <SplitLines />
            </div>
          </div>
        </div>
      </draggable>
    </div>
  </div>
</template>

<script>
/**
 * This component renders a grid of the document pages
 * that will be possible to resort, split and/or rotate
 */

import { mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import SplitLines from "../../assets/images/SplitLines";
import SplitZigZag from "../../assets/images/SplitZigZag";
import draggable from "vuedraggable";

export default {
  name: "EditPages",
  components: {
    ServerImage,
    SplitLines,
    SplitZigZag,
    draggable
  },
  props: {
    activeSplittingLines: {
      type: Array
    }
  },
  data() {
    return {
      editPages: null,
      selected: null
    };
  },
  computed: {
    ...mapState("document", [
      "pages",
      "recalculatingAnnotations",
      "selectedDocument"
    ]),
    ...mapState("edit", [
      "editMode",
      "pagesArray",
      "splitOverview",
      "selectedPages",
      "splitOverview"
    ])
  },
  methods: {
    handlePageChange(pageNumber) {
      this.$emit("change-page", pageNumber);
    },
    isPageSelected(id) {
      if (this.selectedPages.length === 0) return;

      const selectedPage = this.selectedPages.find(page => page.id === id);
      if (selectedPage) return selectedPage.id;
    },
    selectPage(page) {
      if (!page) return;

      const selectedPage = {
        id: page.id,
        number: page.page_number,
        thumbnail_url: page.thumbnail_url
      };

      this.selected = true;

      this.$store.dispatch("edit/setSelectedPages", selectedPage);
    },
    clickOutside(event) {
      if (!event || this.selectedPages.length === 0) return;

      // Check if user clicks in any element other than thumbnail or buttons to deselect the thumbnail
      if (
        event.target.className.includes("button") ||
        event.target.className.includes("thumbnail") ||
        event.target.className.includes("icon")
      ) {
        return;
      }

      this.deselect();
    },
    deselect() {
      this.selected = null;
      this.$store.dispatch("edit/setSelectedPages");
    },
    getRotation(pageId) {
      // rotate page
      return this.pagesArray?.find(p => p.id === pageId)?.angle;
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
  },
  watch: {
    pagesArray(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.editPages = newValue;
      }
    },
    editPages(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.$store.dispatch("edit/setPagesArray", newValue);
      }
    },
    splitOverview(newValue) {
      if (newValue) {
        this.editPages = this.pagesArray;
      }
    }
  },
  created() {
    window.addEventListener("click", event => this.clickOutside(event));
  },
  destroyed() {
    window.removeEventListener("click", this.clickOutside());
  },
  mounted() {
    this.editPages = this.pagesArray;
  }
};
</script>
