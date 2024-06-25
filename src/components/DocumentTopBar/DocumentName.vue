<template>
  <div
    :class="['document-name-component', editMode && 'document-name-edit-mode']"
  >
    <div class="document-icon">
      <ServerImage
        :height="'22px'"
        :image-url="`${selectedDocument.thumbnail_url}?${selectedDocument.downloaded_at}`"
      >
        <b-skeleton width="15px" height="22px" :rounded="false" />
      </ServerImage>
    </div>
    <b-tooltip
      :label="fullText"
      multilined
      :active="isFileNameBiggerThanMaxSize && !isEditable"
      size="is-large"
      position="is-bottom"
    >
      <span class="file-name-section">
        <span
          :class="['document-name', isEditable && 'is-editable']"
          :contenteditable="isEditable"
          @input="handleInput"
          @paste="handlePaste"
          @keydown.enter="handleSave"
          @blur="handleSave"
          >{{ textContent }}</span
        >
      </span>
    </b-tooltip>

    <div
      v-if="
        !publicView &&
        !isDocumentReviewed &&
        showEditBtn &&
        !editMode &&
        !recalculatingAnnotations
      "
      class="edit-btn btn"
      @click="handleEdit"
    >
      {{ $t("rename") }}
    </div>
    <div
      v-if="showSaveBtn && !editMode"
      class="save-btn btn"
      @click="handleSave"
    >
      {{ $t("save") }}
    </div>
    <div v-if="saving" class="message-container">
      <span class="loading-container">
        <b-notification :closable="false" class="loading-background">
          <b-loading v-model="saving" :is-full-page="isFullPage">
            <b-icon icon="spinner" class="fa-spin loading-icon-size spinner" />
          </b-loading>
        </b-notification>
      </span>
      <span>{{ $t("autosaving") }}</span>
    </div>
    <div v-if="changed" class="message-container">
      <span v-if="saved" class="cloud-icon"><FileNameSaved /></span>
      <span v-else class="cloud-icon"><FileNameNotSaved /></span>
      <span>{{ saved ? $t("saved") : $t("not_saved") }}</span>
    </div>

    <div v-if="detailsUrl" class="details-btn btn" @click="openDocumentDetails">
      {{ $t("document_details") }}
    </div>
  </div>
</template>

<script>
import ServerImage from "../../assets/images/ServerImage";
import FileNameSaved from "../../assets/images/FileNameSavedImage";
import FileNameNotSaved from "../../assets/images/FileNameNotSavedImage";
import { mapGetters, mapState } from "vuex";

export default {
  name: "DocumentName",
  components: {
    ServerImage,
    FileNameSaved,
    FileNameNotSaved,
  },
  props: {
    dataFileName: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      maxFilenameChars: 26,
      isEditable: false,
      showEditBtn: true,
      showSaveBtn: false,
      fileExtension: null,
      fileName: null,
      oldFileName: null,
      saving: false,
      isFullPage: false,
      changed: false,
      saved: false,
    };
  },
  computed: {
    ...mapState("document", [
      "selectedDocument",
      "publicView",
      "recalculatingAnnotations",
      "documentId",
    ]),
    ...mapState("display", ["optimalResolution", "detailsUrl"]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("document", ["isDocumentReviewed"]),
    textContent() {
      if (this.isEditable) {
        return this.oldFileName;
      } else if (this.fileName) {
        return this.shortFilenameIfNeeded(
          `${this.fileName}.${this.fileExtension}`
        );
      } else {
        return this.shortFilenameIfNeeded(this.dataFileName);
      }
    },
    fullText() {
      if (this.fileName) {
        return this.fileName;
      } else {
        return this.dataFileName;
      }
    },
    isFileNameBiggerThanMaxSize() {
      if (this.fileName) {
        return this.fileName.length >= this.maxFilenameChars;
      } else {
        return this.dataFileName.length >= this.maxFilenameChars;
      }
    },
  },
  updated() {
    const contentEditable = document.querySelector(".document-name");
    if (this.isEditable && contentEditable) {
      contentEditable.focus();
      this.handleCaretPlacing(contentEditable);
    }

    if (this.changed) {
      const that = this;
      setTimeout(function () {
        that.saved = false;
        that.changed = false;
        that.showEditBtn = true;
        this.showSaveBtn = false;
      }, 4000);
    }
  },
  methods: {
    shortFilenameIfNeeded(filename) {
      if (filename && filename.length >= this.maxFilenameChars) {
        return (
          filename.substr(0, this.maxFilenameChars / 2) +
          "..." +
          filename.substr(
            filename.length - this.maxFilenameChars / 2,
            filename.length
          )
        );
      }
      return filename;
    },
    handleFileName() {
      // Save the file name and the extension in different variables
      this.fileName = this.dataFileName.split(".").slice(0, -1).join(".");

      this.fileExtension = this.dataFileName.split(".").at(-1);
    },
    handleEdit() {
      // Split file name and extension to only edit name
      this.handleFileName();

      this.isEditable = true;
      this.showEditBtn = false;
      this.showSaveBtn = true;
      this.oldFileName = this.fileName;
    },
    handleCaretPlacing(contentEditable) {
      let range, selection;
      if (document.createRange) {
        range = document.createRange(); //Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditable); //Select the entire contents of the element with the range
        range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection(); //get the selection object (allows you to change selection)
        selection.removeAllRanges(); //remove any selections already made
        selection.addRange(range); //make the range you have just created the visible selection
      } else if (document.selection) {
        range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditable); //Select the entire contents of the element with the range
        range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
        range.select(); //Select the range (make it the visible selection
      }
    },
    handlePaste(event) {
      // TODO: modify to only paste plain text
      event.preventDefault();
    },
    handleInput(event) {
      const input = event.target.textContent;

      // Set the new file name to the new input value
      if (input === "") {
        // If the user deletes the name:
        this.fileName = "untitled";
      } else {
        this.fileName = input.trim();
      }
    },
    handleSave(event) {
      this.isEditable = false;

      event.target.textContent = this.fileName;

      const updatedFileName = {
        data_file_name: `${this.fileName}.${this.fileExtension}`,
      };

      this.showSaveBtn = false;
      this.saving = true;

      this.$store
        .dispatch("document/updateDocument", updatedFileName)
        .then((response) => {
          // Check if the response is successful or not
          if (response) {
            // if successful, set the old name to be the new name
            this.changed = true;
            this.oldFileName = this.fileName;
            this.saved = true;
          }
        })
        .catch((error) => {
          this.changed = true;
          event.target.textContent = this.oldFileName;
          this.fileName = this.oldFileName;
        })
        .finally(() => {
          this.saving = false;
        });

      // Remove focus from contenteditable
      const contentNotEditable = document.querySelector(".document-name");
      if (contentNotEditable) {
        contentNotEditable.blur();
      }
    },
    openDocumentDetails() {
      window.location.href = this.detailsUrl;
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_name.scss"></style>
