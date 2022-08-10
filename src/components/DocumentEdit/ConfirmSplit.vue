<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="confirm-split-container">
    <div
      v-for="(page, index) in splitPages"
      :key="index"
      class="document-details"
    >
      <div class="overview-thumbnails">
        <div class="split-documents">
          <div class="image-container" @click="handlePageChange(page.pages[0])">
            <div class="thumbnail">
              <div class="img-container">
                <ServerImage :imageUrl="`${page.img_url}`" />
              </div>
              <div class="icon-container">
                <div class="action-icon">
                  <b-icon
                    icon="eye"
                    class="is-small"
                    @click="handlePageChange(page.pages[0])"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="file-name-section">
        <div class="name-input" @click="handleEditable(true)">
          <span
            ref="contentEditable"
            :class="[
              'content-editable',
              editable ? 'is-editable' : 'not-editable'
            ]"
            :contenteditable="editable"
            @blur="handleEditable(false)"
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
</template>

<script>
import DocumentCategory from "../DocumentTopBar/DocumentCategory";
import ServerImage from "../../assets/images/ServerImage";

export default {
  name: "ConfirmSplit",
  components: {
    DocumentCategory,
    ServerImage
  },
  props: {
    selectedDocument: {
      type: Object
    },
    splitPages: {
      type: Array
    },
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
      editable: false,
      splitMode: true
    };
  },
  methods: {
    handleEditable(value) {
      this.editable = value;
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
    }
  },
  mounted() {
    console.log(this.splitPages);
  }
};
</script>
