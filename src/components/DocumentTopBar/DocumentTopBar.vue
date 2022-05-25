<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar">
    <div class="category-drop-down">
      <div class="icon">
        <CategoryIcon />
      </div>
      <div class="category-info">
        <p>Category</p>
        <div class="category-name">Zugticket</div>
      </div>
      <div class="caret">
        <CaretDown />
      </div>
    </div>
    <div class="document-name-container">
      <div class="document-icon">
        <EmptyDoc />
      </div>
      <span class="file-name-section">
        <span
          v-if="isEditable"
          class="document-name"
          contenteditable
          @input="event => handleInput(event)"
          @keydown.enter="event => handleSave(event)"
          @blur="handleSave"
          >{{ oldFileNameWithoutExtension }}</span
        >
        <span v-else class="document-name" contenteditable="false">{{
          fileNameWithoutExtension ? fileNameWithoutExtension : fileName
        }}</span>
        <span v-if="fileExtension && !isEditable" class="file-extension"
          >.{{ fileExtension }}</span
        >
      </span>
      <div v-if="showEditBtn" class="edit-btn btn" @click="handleEdit">
        Edit
      </div>
      <div v-if="showSaveBtn" class="save-btn btn" @click="handleSave">
        Save
      </div>
      <div v-if="saving" class="message-container">
        <span class="loading-container">
          <b-notification :closable="false" class="loading-background">
            <b-loading :is-full-page="isFullPage" v-model="saving">
              <b-icon icon="spinner" class="fa-spin loading-icon-size spinner">
              </b-icon>
            </b-loading>
          </b-notification>
        </span>
        <span>Auto saving...</span>
      </div>
      <div v-if="changed" class="message-container">
        <span v-if="saved" class="cloud-icon"><FileNameSaved /></span>
        <span v-else class="cloud-icon"><FileNameNotSaved /></span>
        <span>{{ messageToUser }}</span>
      </div>
    </div>
    <div class="handover">
      <button class="handover-btn">Handover</button>
    </div>
  </div>
</template>

<script>
import CaretDown from "../../assets/images/TopBarCaretDownImg.vue";
import CategoryIcon from "../../assets/images/CategoryIconImg.vue";
import EmptyDoc from "../../assets/images/EmptyDocImg.vue";
import FileNameSaved from "../../assets/images/FileNameSavedImage.vue";
import FileNameNotSaved from "../../assets/images/FileNameNotSavedImage.vue";
import { mapState } from "vuex";

export default {
  name: "DocumentTopBar",
  data() {
    return {
      isEditable: false,
      showEditBtn: true,
      showSaveBtn: false,
      fileExtension: null,
      fileNameWithoutExtension: null,
      oldFileNameWithoutExtension: null,
      saving: false,
      isFullPage: false,
      messageToUser: null,
      changed: false,
      saved: false
    };
  },
  components: {
    CaretDown,
    CategoryIcon,
    EmptyDoc,
    FileNameSaved,
    FileNameNotSaved
  },
  computed: {
    ...mapState("document", { fileName: "fileName" })
  },
  methods: {
    handleEdit() {
      this.isEditable = true;
      this.showEditBtn = false;
      this.showSaveBtn = true;
      this.oldFileNameWithoutExtension = this.fileNameWithoutExtension;
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
    handleInput(event) {
      const input = event.target.textContent;

      // Set the new file name to the new input value
      if (input === "") {
        // If the user deletes the name:
        this.fileNameWithoutExtension = "untitled";
      } else {
        this.fileNameWithoutExtension = input.trim();
      }
    },
    handleSave(event) {
      this.isEditable = false;

      event.target.textContent = this.fileNameWithoutExtension;

      const updatedFileName = {
        data_file_name: `${this.fileNameWithoutExtension}.${this.fileExtension}`
      };

      this.showSaveBtn = false;
      this.$store.dispatch("document/startLoading");
      this.saving = true;

      this.$store
        .dispatch("document/updateFileName", updatedFileName)
        .then(response => {
          // Check if the response is successfull or not
          if (response) {
            // if successful, set the old name to be the new name
            this.changed = true;
            this.oldFileNameWithoutExtension = this.fileNameWithoutExtension;
            this.saved = true;
            this.messageToUser = "Saved";
          } else {
            this.changed = true;
            event.target.textContent = this.oldFileNameWithoutExtension;
            this.fileNameWithoutExtension = this.oldFileNameWithoutExtension;
            this.messageToUser = "Could not save. Try again";
          }
        })
        .finally(() => {
          this.$store.dispatch("document/endLoading");
          this.saving = false;
        });

      // Remove focus from contenteditable
      document.querySelector(".document-name").blur();
    }
  },
  watch: {
    fileName(newName) {
      // Save the file name and the extension in different variables
      this.fileNameWithoutExtension = newName.split(".").slice(0, -1).join(".");
      this.fileExtension = newName.split(".").at(-1);
    }
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
  }
};
</script>
