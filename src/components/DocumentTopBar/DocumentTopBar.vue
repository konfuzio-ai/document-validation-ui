<template>
  <div ref="documentTopBar" class="document-top-bar-component">
    <div
      v-if="selectedDocument && selectedDocument.pages.length > 0 && !loading"
      class="document-top-bar"
    >
      <div class="left-bar-components">
        <DocumentCategory
          v-if="categories && !editMode && !recalculatingAnnotations"
        />
        <DocumentDatasetStatus
          v-if="showDatasetDropdown && !editMode && !recalculatingAnnotations"
          :dataset-status="selectedDocument.dataset_status"
        />
      </div>

      <DocumentName :data-file-name="selectedDocument.data_file_name" />

      <div class="right-bar-components">
        <div
          v-if="!editMode && (publicView || selectedDocument.is_reviewed)"
          class="read-only-info"
        >
          <b-tooltip
            type="is-dark"
            :animated="false"
            position="is-bottom"
            class="right-aligned width-184"
          >
            <span v-if="publicView && !selectedDocument.is_reviewed">
              {{ $t("lite_mode") }}
            </span>
            <span v-else class="doc-reviewed">
              {{ $t("reviewed_mode") }}
            </span>
            <b-icon
              :class="[
                'info-icon is-small',
                selectedDocument.is_reviewed && 'info-reviewed',
              ]"
              icon="circle-info"
            />
            <template #content>
              <div
                v-if="!selectedDocument.is_reviewed"
                class="read-only-details"
              >
                {{ $t("limited_functionalities") }}
              </div>
              <div v-else class="read-only-details">
                {{ $t("document_reviewed") }}
              </div>
            </template>
          </b-tooltip>
        </div>

        <div v-if="editMode" class="edit-mode-buttons">
          <DocumentTopBarButtons />
        </div>

        <div v-if="showHandoverButton && !editMode" class="handover">
          <DocumentHandover />
        </div>

        <div
          v-if="!editMode && (!publicView || !selectedDocument.is_reviewed)"
          class="keyboard-actions-info"
        >
          <KeyboardActionsDescription />
        </div>
      </div>
    </div>
    <div v-else class="loading-top-bar">
      <b-skeleton position="is-centered" width="25%" height="60%" />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import DocumentDatasetStatus from "./DocumentDatasetStatus";
import DocumentCategory from "../../components/DocumentCategory";
import DocumentName from "./DocumentName";
import DocumentHandover from "./DocumentHandover";
import DocumentTopBarButtons from "./DocumentTopBarButtons";
import KeyboardActionsDescription from "./KeyboardActionsDescription";

/**
 * This component has different functionalities
 * based on Dashboard View or Edit Mode
 */

export default {
  name: "DocumentTopBar",
  components: {
    DocumentCategory,
    DocumentDatasetStatus,
    DocumentName,
    DocumentHandover,
    DocumentTopBarButtons,
    KeyboardActionsDescription,
  },
  data() {
    return {
      categoryError: false,
      showDatasetDropdown: false,
      showHandoverButton: false,
    };
  },
  computed: {
    ...mapState("document", [
      "selectedDocument",
      "publicView",
      "loading",
      "recalculatingAnnotations",
    ]),
    ...mapState("category", ["categories"]),
    ...mapState("edit", ["editMode"]),
  },
  created() {
    window.addEventListener("resize", this.handleResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.handleResize);
  },
  mounted() {
    if (this.$refs.documentTopBar) {
      this.setComponentWidth(this.$refs.documentTopBar.offsetWidth);
    }
  },
  methods: {
    setComponentWidth(width) {
      // set width for the error messages to match the width
      // and avoid going over the Dashboard
      this.$store.dispatch("document/setErrorMessageWidth", width);
    },
    handleResize() {
      this.setComponentWidth(this.$refs.documentTopBar.offsetWidth);
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>
