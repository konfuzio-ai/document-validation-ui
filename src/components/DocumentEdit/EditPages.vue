<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="edit-pages">
    <draggable
      v-model="editPages"
      class="document-grid"
      easing="cubic-bezier(0.37, 0, 0.63, 1)"
      @start="dragging = true"
      @end="handleDragEnd"
      @move="checkMove"
    >
      <div
        v-for="(page, index) in editPages"
        :key="page.id"
        class="image-section"
        tabindex="0"
        @focusout="clickOutside"
      >
        <div
          class="image-container"
          :tabindex="index"
          @click="selectPage(page)"
        >
          <div class="thumbnail">
            <div
              :class="[
                'img-container',
                selected && isPageSelected(page.id) === page.id && 'selected'
              ]"
            >
              <ServerImage
                class="img-thumbnail"
                :imageUrl="`${page.thumbnail_url}?${page.updated_at}`"
                :style="{
                  transform: 'rotate(' + getRotation(page.id) + 'deg)'
                }"
              >
                <b-skeleton width="57px" height="57px" />
              </ServerImage>
            </div>
            <div class="icon-container">
              <div class="action-icon">
                <EyeIcon />
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
import EyeIcon from "../../assets/images/EyeIcon";
import draggable from "vuedraggable";

export default {
  name: "EditPages",
  components: {
    ServerImage,
    SplitLines,
    SplitZigZag,
    EyeIcon,
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
      "documentPagesListForEditMode",
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
      this.$emit("change-page", page.page_number);
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
        event.target.className.includes("image-container") ||
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
      return this.documentPagesListForEditMode?.find(p => p.id === pageId)
        ?.angle;
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
    documentPagesListForEditMode(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.editPages = newValue;
      }
    },
    editPages(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.$store.dispatch("edit/setDocumentPagesListForEditMode", newValue);
      }
    },
    splitOverview(newValue) {
      if (newValue) {
        this.editPages = this.documentPagesListForEditMode;
      }
    }
  },
  mounted() {
    this.editPages = this.documentPagesListForEditMode;
  }
};
</script>
