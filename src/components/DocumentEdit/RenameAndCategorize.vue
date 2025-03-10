<template>
  <div class="rename-and-categorize">
    <div class="back-section" @click="handleBackButton">
      <div class="back-btn-section">
        <b-icon
          icon="arrow-left"
          class="is-small arrow"
          :style="{ color: '#1a1a1a', cursor: 'pointer' }"
        />
      </div>
      <div class="back-text">
        {{ $t("rotate_split_reorder") }}
      </div>
    </div>
    <div class="rename-and-categorize-title">
      {{ $t("rename_and_categorize") }}
    </div>
    <div class="new-documents-container">
      <div
        v-for="(page, index) in updatedDocument"
        :key="index"
        class="document-details"
      >
        <div class="rename-and-categorize-thumbnails">
          <div class="split-documents">
            <div
              class="image-container"
              @click="handlePageChange(page.pages[0].number)"
            >
              <div
                :class="['thumbnail', page.pages.length > 1 && 'page-stack']"
              >
                <ServerImage
                  ref="image"
                  :style="{
                    transform:
                      'rotate(' + getRotation(page.pages[0].id) + 'deg)',
                  }"
                  :image-url="getImageUrl(page)"
                  class="page-thumbnail"
                >
                  <b-skeleton width="60px" height="60px" />
                </ServerImage>
                <div class="icon-container">
                  <div class="action-icon">
                    <EyeIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="doc-info">
          <div class="file-name-section">
            <input
              type="text"
              class="name-input"
              :value="getFileName(page.name)"
              @input="handleInput"
              @paste="handlePaste"
              @blur="handleChanges(page)"
            />
            <div class="file-extension-container">
              <span>{{ `.${fileExtension}` }}</span>
            </div>
          </div>
          <div class="category">
            <DocumentCategory
              :selected-document="selectedDocument"
              :split-mode="splitMode"
              :page="page"
              :index="index"
              @category-change="handleChanges"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * This component will only be rendered if document pages were split
 */

import { mapState } from "vuex";
import DocumentCategory from "../../components/DocumentCategory";
import ServerImage from "../../assets/images/ServerImage";
import EyeIcon from "../../assets/images/EyeIcon";

export default {
  name: "RenameAndCategorize",
  components: {
    DocumentCategory,
    ServerImage,
    EyeIcon,
  },
  props: {
    fileName: {
      type: String,
      default: "",
    },
    fileExtension: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      splitMode: true,
      updatedFileName: null,
    };
  },
  computed: {
    ...mapState("document", ["selectedDocument", "pages"]),
    ...mapState("edit", ["updatedDocument", "pagesForPostprocess"]),
  },

  methods: {
    handleBackButton() {
      this.$store.dispatch("edit/setRenameAndCategorize", false);
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    handleInput(event) {
      this.updatedFileName = event.target.value.trim();
    },
    handleChanges(page, category) {
      // This function handles file name or category changes
      const updatedPages = this.updatedDocument.map((splitPage) => {
        if (splitPage.pages[0].id === page.pages[0].id) {
          if (this.updatedFileName) {
            return {
              ...splitPage,
              name: `${this.updatedFileName}.${this.fileExtension}`,
            };
          } else if (category) {
            return {
              ...splitPage,
              category: category,
            };
          } else {
            return splitPage;
          }
        }
        return splitPage;
      });

      this.$store.dispatch("edit/setUpdatedDocument", updatedPages);

      if (this.updatedFileName) {
        this.updatedFileName = null;
      }
    },
    handlePageChange(pageNumber) {
      this.$emit("change-page", pageNumber);
    },
    getFileName(name) {
      if (!name) return;

      // Do not show file extension
      return name.split(".").slice(0, -1).join(".");
    },
    getImageUrl(page) {
      if (!this.pagesForPostprocess || !this.pages || !page) return;

      // returns the first thumbnail in the pages array
      // for each new document
      const image = this.pagesForPostprocess.find(
        (p) => p.number === page.pages[0].number
      );

      return `${image.thumbnail_url}?${image.updated_at}`;
    },
    getRotation(pageId) {
      // rotate page
      return this.pagesForPostprocess?.find((p) => p.id === pageId)?.angle;
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
