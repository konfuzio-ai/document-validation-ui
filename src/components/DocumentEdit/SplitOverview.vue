<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="confirm-split">
    <div class="back-btn-section" @click="handleBackButton">
      <b-icon
        icon="arrow-left"
        class="is-small arrow"
        :style="{ color: '#858C9A', cursor: 'pointer' }"
      />
    </div>
    <div class="new-documents-container">
      <div
        v-for="(page, index) in splitPages"
        :key="index"
        class="document-details"
      >
        <div class="overview-thumbnails">
          <div class="split-documents">
            <div
              class="image-container"
              @click="handlePageChange(page.pages[0].number)"
            >
              <div class="thumbnail">
                <ServerImage :imageUrl="getImageUrl(page)" ref="image" />
                <div class="icon-container">
                  <div class="action-icon">
                    <b-icon icon="eye" class="is-small" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="file-name-section">
          <div class="name-input">
            <span
              contenteditable
              role="textbox"
              class="content-editable"
              @input="handleInput"
              @paste="handlePaste"
              @blur="handleChanges(page)"
            >
              {{ getFileName(page.name) }}
            </span>
          </div>
          <div class="file-extension-container">
            <span>{{ `.${fileExtension}` }}</span>
          </div>
        </div>
        <div class="category">
          <DocumentCategory
            :selectedDocument="selectedDocument"
            :splitMode="splitMode"
            :page="page"
            @category-change="handleChanges"
            :handleShowError="handleShowError"
            :handleMessage="handleMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import DocumentCategory from "../DocumentTopBar/DocumentCategory";
import ServerImage from "../../assets/images/ServerImage";

export default {
  name: "SplitOverview",
  components: {
    DocumentCategory,
    ServerImage
  },
  props: {
    fileName: {
      type: String
    },
    fileExtension: {
      type: String
    },
    handleShowError: {
      type: Function
    },
    handleMessage: {
      type: Function
    },
    pagesArray: {
      type: Array
    }
  },
  data() {
    return {
      splitMode: true,
      updatedFileName: null
    };
  },
  computed: {
    ...mapState("document", ["selectedDocument", "pages"]),
    ...mapState("edit", ["splitPages"])
  },
  methods: {
    handleBackButton() {
      this.$emit("go-back");
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    handleInput(event) {
      this.updatedFileName = event.target.textContent.trim();
    },
    handleChanges(page, category) {
      // This function handles file name or category changes
      const updatedSplitPages = this.splitPages.map(splitPage => {
        if (splitPage.pages[0].number === page.pages[0].number) {
          if (this.updatedFileName) {
            return {
              ...splitPage,
              name: `${this.updatedFileName}.${this.fileExtension}`
            };
          } else if (category) {
            return {
              ...splitPage,
              category: category
            };
          } else {
            return;
          }
        }
        return splitPage;
      });

      this.$store.dispatch("edit/setSplitPages", updatedSplitPages);

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
      if (!this.pagesArray || !this.pages) return;

      // returns the first thumbnail in the pages array
      // for each new document
      const image = this.pagesArray.find(
        p => p.number === page.pages[0].number
      );

      return `${image.thumbnail_url}?${image.updated_at}`;
    }
  }
};
</script>
