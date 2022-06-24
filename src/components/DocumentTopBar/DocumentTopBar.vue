<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar-component" v-if="selectedDocument">
    <div class="document-top-bar">
      <div class="left-bar-components">
        <DocumentCategory
          :selectedDocument="selectedDocument"
          :handleShowError="handleShowError"
          :handleMessage="handleMessage"
        />
        <DocumentDatasetStatus
          v-if="showDatasetDropdown"
          :datasetStatus="selectedDocument.dataset_status"
          :handleShowError="handleShowError"
        />
      </div>

      <div class="document-name-container">
        <DocumentName :dataFileName="selectedDocument.data_file_name" />
      </div>
      <div class="handover"><DocumentHandover v-if="showHandoverButton" /></div>
    </div>
    <transition name="slide-fade">
      <div v-if="showError" class="error-message">
        <b-message class="">
          <div class="message-container">
            {{ categoryError ? $t("category_error") : $t("status_error") }}
          </div>
          <div @click="handleErrorClose" class="btn-container">
            <CloseBtn class="close-btn" />
          </div>
        </b-message>
      </div>
    </transition>
  </div>
</template>

<script>
import DocumentDatasetStatus from "./DocumentDatasetStatus.vue";
import DocumentCategory from "./DocumentCategory.vue";
import DocumentName from "./DocumentName.vue";
import DocumentHandover from "./DocumentHandover.vue";
import CloseBtn from "../../assets/images/CloseBtnWhite.vue";
import { mapState } from "vuex";

export default {
  name: "DocumentTopBar",
  data() {
    return {
      showError: false,
      categoryError: false,
      showDatasetDropdown:
        process.env.VUE_APP_SHOW_DATA_SET_STATUS_DROPDOWN &&
        process.env.VUE_APP_SHOW_DATA_SET_STATUS_DROPDOWN == "true",
      showHandoverButton:
        process.env.VUE_APP_SHOW_HANDOVER_BUTTON &&
        process.env.VUE_APP_SHOW_HANDOVER_BUTTON == "true"
    };
  },
  components: {
    DocumentCategory,
    DocumentDatasetStatus,
    DocumentName,
    DocumentHandover,
    CloseBtn
  },
  computed: {
    ...mapState("document", ["selectedDocument"])
  },
  methods: {
    handleShowError() {
      this.showError = true;
    },
    handleMessage() {
      this.categoryError = true;
    },
    handleErrorClose() {
      this.showError = false;
      this.categoryError = false;
    }
  }
};
</script>
