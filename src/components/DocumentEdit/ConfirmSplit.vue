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
            {{ page.name.trim() }}
          </span>
        </div>
        <div class="file-extension-container">
          <span>.pdf</span>
        </div>
      </div>
      <div class="category">
        <DocumentCategory :selectedDocument="selectedDocument" />
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
    }
  },
  data() {
    return {
      editable: false
    };
  },
  methods: {
    handleEditable(value) {
      this.editable = value;
    }
    // TODO: get file name and extension separately
  }
};
</script>
