<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar-component" v-if="selectedDocument">
    <div class="document-top-bar">
      <div class="left-bar-components">
        <DocumentCategory
          v-if="!editMode"
          :selectedDocument="selectedDocument"
          :handleError="handleShowError"
          :handleMessage="handleShowMessage"
        />
        <DocumentDatasetStatus
          v-if="showDatasetDropdown && !editMode"
          :datasetStatus="selectedDocument.dataset_status"
          :handleError="handleShowError"
          :handleMessage="handleShowMessage"
        />
      </div>

      <div class="document-name-container">
        <DocumentName :dataFileName="selectedDocument.data_file_name" />
      </div>
      <div class="handover" v-if="showHandoverButton && !editMode">
        <DocumentHandover />
      </div>

      <div class="edit-mode-buttons" v-if="editMode">
        <div class="buttons">
          <b-button
            :label="$t('cancel')"
            class="button-cancel"
            type="is-default"
            @click="handleCancelEditing"
          />
          <b-button
            :label="
              editMode && splitPages.length > 1 ? $t('next') : $t('submit')
            "
            type="is-primary"
            :disabled="false"
            @click="handleNext"
          />
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
    ...mapState("document", ["selectedDocument"]),
    ...mapState("edit", ["editMode", "splitOverview", "splitPages"])
  },
  methods: {
    handleShowError() {
      this.$emit("handle-error");
    },
    handleShowMessage(message) {
      this.$emit("handle-message", message);
    },
    handleCancelEditing() {
      this.$store.dispatch("edit/disableEditMode").then(() => {
        this.$store.dispatch("display/updateFit", "width");
      });
    },
    handleNext() {
      if (this.splitPages.length > 1) {
        // then next view
        if (this.splitOverview) {
          this.$store.dispatch("edit/editDocument", this.splitPages);
          this.handleCloseEditing();
        } else {
          this.$store.dispatch("edit/setSplitOverview", true);
        }
        // handle submit
        this.$emit("submit-rotation");
        // handle submit
        this.$store.dispatch("edit/disableEditMode");
      }
    }
  }
};
</script>
