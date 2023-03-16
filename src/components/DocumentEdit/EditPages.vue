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
                selected && isPageSelected(page.id) === page.id && 'selected',
              ]"
            >
              <ServerImage
                class="img-thumbnail"
                :image-url="`${page.thumbnail_url}?${page.updated_at}`"
                :style="{
                  transform: 'rotate(' + getRotation(page.id) + 'deg)',
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
          <span class="page-number">{{ page.number }}</span>
        </div>
        <div
          :class="[
            'splitting-lines',
            activeSplittingLines &&
              activeSplittingLines[index].page === page.number &&
              'active-split',
          ]"
          @click="handleSplittingLines(page.number, 'manual')"
        >
          <div class="scissors-icon">
            <b-icon icon="scissors" class="is-small" />
          </div>
          <div
            v-if="
              activeSplittingLines &&
              activeSplittingLines[index].page === page.number
            "
            class="lines"
          >
            <SplitZigZag
              :color="
                activeSplittingLines &&
                activeSplittingLines[index].origin &&
                activeSplittingLines[index].origin === 'AI' &&
                splitSuggestionsEnabled
                  ? 'green'
                  : 'dark'
              "
            />
          </div>
          <div v-else class="lines">
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
    draggable,
  },
  props: {
    activeSplittingLines: {
      type: Array,
      default: null,
    },
    splitSuggestionsEnabled: {
      type: Boolean,
    },
  },
  data() {
    return {
      editPages: null,
      selected: null,
    };
  },

  computed: {
    ...mapState("document", [
      "pages",
      "recalculatingAnnotations",
      "selectedDocument",
      "splittingSuggestions",
    ]),
    ...mapState("edit", [
      "editMode",
      "pagesForPostprocess",
      "splitOverview",
      "selectedPages",
      "splitOverview",
    ]),
  },
  watch: {
    pagesForPostprocess(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.editPages = newValue;
      }
    },
    editPages(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.$store.dispatch("edit/setPagesForPostprocess", newValue);
      }
    },
    splitOverview(newValue) {
      if (newValue) {
        this.editPages = this.pagesForPostprocess;
      }
    },
  },
  mounted() {
    this.editPages = this.pagesForPostprocess;
  },
  methods: {
    handlePageChange(pageNumber) {
      this.$emit("change-page", pageNumber);
    },
    isPageSelected(id) {
      if (this.selectedPages.length === 0) return;
      const selectedPage = this.selectedPages.find((page) => page.id === id);
      if (selectedPage) return selectedPage.id;
    },
    selectPage(page) {
      if (!page) return;
      this.$emit("change-page", page.number);
      const selectedPage = {
        id: page.id,
        number: page.number,
        thumbnail_url: page.thumbnail_url,
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
      return this.pagesForPostprocess?.find((p) => p.id === pageId)?.angle;
    },
    handleSplittingLines(page, origin) {
      this.$emit("handle-splitting-lines", page, origin);
    },
    checkMove(event) {
      this.$emit("check-move", event);
    },
    handleDragEnd() {
      this.draggable = false;

      this.$emit("handle-drag-end");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
