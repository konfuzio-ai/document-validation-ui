<template>
  <div class="edit-pages">
    <div class="grid-header">
      <span class="header-title">{{ $t("rotate_split_reorder") }}</span>
    </div>
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
      >
        <div class="top-section">
          <EditPageThumbnail
            :page="page"
            :index="index"
            :rotation="getRotation(page.id)"
          />
          <div
            :class="[
              'splitting-lines',
              splittingLines &&
                splittingLines[index].page === page.number &&
                'active-split',
            ]"
            @click="handleSplittingLines(page.number, 'manual')"
          >
            <div class="scissors-icon">
              <b-icon icon="scissors" class="is-small" />
            </div>
            <div
              v-if="
                splittingLines && splittingLines[index].page === page.number
              "
              class="lines active-split"
            >
              <SplitZigZag
                :color="
                  splittingLines &&
                  splittingLines[index].origin &&
                  splittingLines[index].origin === 'AI' &&
                  splitSuggestionsEnabled
                    ? 'green'
                    : 'dark'
                "
              />
            </div>
            <div v-else class="lines not-active-split">
              <SplitLines />
            </div>
          </div>
        </div>
        <div class="bottom-section">
          <span class="page-number">{{ page.number }}</span>
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
import SplitLines from "../../assets/images/SplitLines";
import SplitZigZag from "../../assets/images/SplitZigZag";
import EditPageThumbnail from "./EditPageThumbnail";

import draggable from "vuedraggable";

export default {
  name: "EditPages",
  components: {
    SplitLines,
    SplitZigZag,
    EditPageThumbnail,
    draggable,
  },
  props: {
    splittingLines: {
      type: Array,
      default: null,
    },
    splitSuggestionsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      editPages: null,
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
      "renameAndCategorize",
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
    renameAndCategorize(newValue) {
      if (newValue) {
        this.editPages = this.pagesForPostprocess;
      }
    },
  },
  mounted() {
    this.editPages = this.pagesForPostprocess;
  },
  methods: {
    deselect() {
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
