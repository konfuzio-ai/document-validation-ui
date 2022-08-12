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
                <ServerImage :imageUrl="getImageUrl(page)" />
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
              @input="event => handleNameChange(event, page)"
              @paste="event => event.preventDefault()"
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
            @category-change="handleCategoryChange"
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
    }
  },
  data() {
    return {
      splitMode: true
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
    handleNameChange(event, page) {
      const updatedSplitPages = this.splitPages.map(splitPage => {
        if (splitPage.pages[0].number === page.pages[0].number) {
          return {
            ...splitPage,
            name: `${event.target.textContent.trim()}.${this.fileExtension}`
          };
        }
        return splitPage;
      });

      this.$store.dispatch("edit/setSplitPages", updatedSplitPages);
    },
    handleCategoryChange(category) {
      console.log("category", category);
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
      // returns the first thumbnail in the pages array
      // for each new document
      const image = this.pages.find(p => p.number === page.pages[0].number);

      return `${image.thumbnail_url}?${image.updated_at}`;
    }
  }
};
</script>
