<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="confirm-split-container">
    <div
      v-for="(page, index) in splitPages"
      :key="index"
      class="document-details"
    >
      <div class="overview-thumbnails">
        <div class="split-documents"></div>
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
            {{ fileNames[index] }}
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
    fileNames: {
      type: Array
    },
    fileExtension: {
      type: String
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
    }
  }
};
</script>
