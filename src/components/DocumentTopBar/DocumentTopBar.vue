<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar" v-if="selectedDocument">
    <div class="left-bar-components">
      <DocumentCategory :selectedDocument="selectedDocument" />
      <DocumentDatasetStatus :datasetStatus="selectedDocument.dataset_status" />
    </div>

    <div class="document-name-container">
      <DocumentName :dataFileName="selectedDocument.data_file_name" />
    </div>
    <div class="handover"><DocumentHandover /></div>
    <transition name="slide-fade">
      <div v-if="showError" class="message">
        <b-message
          class="is-danger danger-msg message-body-border-color message-body-padding"
        >
          <div class="message-container">
            {{ $t("error_message") }}
            <div @click="handleErrorClose" class="btn-container">
              <CloseBtnImg class="close-btn" />
            </div>
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
import CloseBtnImg from "../../assets/images/CloseBtnImg.vue";
import { mapState } from "vuex";

export default {
  name: "DocumentTopBar",
  data() {
    return {
      showError: false
    };
  },
  components: {
    DocumentCategory,
    DocumentDatasetStatus,
    DocumentName,
    DocumentHandover,
    CloseBtnImg
  },
  computed: {
    ...mapState("document", ["selectedDocument"])
  },
  methods: {
    handleErrorClose() {
      this.showError = false;
    }
  }
};
</script>
