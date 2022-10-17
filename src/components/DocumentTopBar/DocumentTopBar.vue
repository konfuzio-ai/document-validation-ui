<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar-component" v-if="selectedDocument">
    <div class="document-top-bar">
      <div class="left-bar-components">
        <DocumentCategory
          v-if="categories && !editMode"
          :selectedDocument="selectedDocument"
        />
        <DocumentDatasetStatus
          v-if="showDatasetDropdown && !editMode"
          :datasetStatus="selectedDocument.dataset_status"
        />
      </div>

      <DocumentName :dataFileName="selectedDocument.data_file_name" />

      <div class="right-bar-components">
        <div class="public-mode-info" v-if="publicView && !editMode">
          <b-tooltip
            type="is-dark"
            :animated="false"
            position="is-bottom"
            class="right-aligned width-184"
          >
            {{ $t("lite_mode")
            }}<b-icon class="info-icon is-small" icon="circle-info" />
            <template v-slot:content>
              <div
                v-if="!selectedDocument.is_reviewed"
                class="public-mode-details"
              >
                {{ $t("limited_functionalities") }}
              </div>
              <div v-else class="public-mode-details">
                {{ $t("document_reviewed") }}
              </div>
            </template>
          </b-tooltip>
        </div>

        <div class="edit-mode-buttons" v-if="editMode">
          <DocumentTopBarButtons />
        </div>

        <div class="handover" v-if="showHandoverButton && !editMode">
          <DocumentHandover />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import DocumentDatasetStatus from "./DocumentDatasetStatus";
import DocumentCategory from "./DocumentCategory";
import DocumentName from "./DocumentName";
import DocumentHandover from "./DocumentHandover";
import DocumentTopBarButtons from "./DocumentTopBarButtons";

/**
 * This component has different functionalities
 * based on Dashboard View or Edit Mode
 */

export default {
  name: "DocumentTopBar",
  data() {
    return {
      categoryError: false,
      showDatasetDropdown: false,
      showHandoverButton: false
    };
  },
  components: {
    DocumentCategory,
    DocumentDatasetStatus,
    DocumentName,
    DocumentHandover,
    DocumentTopBarButtons
  },
  computed: {
    ...mapState("document", ["selectedDocument", "publicView"]),
    ...mapState("category", ["categories"]),
    ...mapState("edit", ["editMode"])
  }
};
</script>
