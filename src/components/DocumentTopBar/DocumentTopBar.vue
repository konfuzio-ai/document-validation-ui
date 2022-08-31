<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar-component" v-if="selectedDocument">
    <div class="document-top-bar">
      <div class="left-bar-components">
        <DocumentCategory
          v-if="categories"
          :selectedDocument="selectedDocument"
          :handleError="handleShowError"
          :handleMessage="handleShowMessage"
        />
        <DocumentDatasetStatus
          v-if="showDatasetDropdown"
          :datasetStatus="selectedDocument.dataset_status"
          :handleError="handleShowError"
          :handleMessage="handleShowMessage"
        />
      </div>

      <div class="document-name-container">
        <DocumentName :dataFileName="selectedDocument.data_file_name" />
      </div>
      <div class="right-bar-components">
        <div class="public-mode-info" v-if="publicView">
          <b-tooltip
            type="is-dark"
            :animated="false"
            position="is-bottom"
            class="right-aligned width-184"
          >
            {{ $t("lite_mode")
            }}<b-icon class="info-icon is-small" icon="circle-info" />
            <template v-slot:content>
              <div class="public-mode-details">
                {{ $t("limited_functionalities") }}
              </div>
            </template>
          </b-tooltip>
        </div>
        <div class="handover" v-else-if="showHandoverButton">
          <DocumentHandover />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DocumentDatasetStatus from "./DocumentDatasetStatus.vue";
import DocumentCategory from "./DocumentCategory.vue";
import DocumentName from "./DocumentName.vue";
import DocumentHandover from "./DocumentHandover.vue";
import { mapState } from "vuex";

export default {
  name: "DocumentTopBar",
  data() {
    return {
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
    DocumentHandover
  },
  props: {
    showError: {
      type: Boolean
    }
  },
  computed: {
    ...mapState("document", ["selectedDocument", "publicView"]),
    ...mapState("category", ["categories"])
  },
  methods: {
    handleShowError() {
      this.$emit("handle-error");
    },
    handleShowMessage(message) {
      this.$emit("handle-message", message);
    }
  }
};
</script>
