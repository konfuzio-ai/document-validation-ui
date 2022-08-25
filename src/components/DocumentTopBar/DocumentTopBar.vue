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
            @click="closeEditMode"
          />
          <b-button
            :label="
              editMode &&
              updatedDocument &&
              updatedDocument.length > 1 &&
              !splitOverview
                ? $t('next')
                : $t('submit')
            "
            type="is-primary"
            :disabled="false"
            @click="handleButton"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * This component has different functionalities
 * when on Dashboard View or Edit Mode
 */
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
    ...mapState("edit", ["editMode", "splitOverview", "updatedDocument"])
  },
  methods: {
    handleShowError() {
      this.$emit("handle-error");
    },
    handleShowMessage(message) {
      this.$emit("handle-message", message);
    },

    /** EDIT MODE */
    closeEditMode() {
      this.$store.dispatch("edit/disableEditMode").then(() => {
        this.$store.dispatch("display/updateFit", "width");
      });
      this.$store.dispatch("edit/setSplitOverview", false);
      this.$store.dispatch("edit/setUpdatedDocument", null);
      this.$store.dispatch("edit/setSelectedPages", null);
    },
    handleButton() {
      // Check if we are not in the split overview
      // and if we have a split document
      if (!this.splitOverview && this.updatedDocument.length > 1) {
        // Enable the "next" button to go to the overview
        this.$store.dispatch("edit/setSplitOverview", true);
        this.$store.dispatch("edit/setSelectedPages", null);
        return;
      }

      // If we are in the overview (so more than 1 doc)
      // or in the edit mode (only 1 doc)
      if (this.updatedDocument) {
        this.$store.dispatch("document/startLoading");
        this.$store.dispatch("document/startRecalculatingAnnotations");

        // Send update request to the backend
        this.$store
          .dispatch("edit/editDocument", this.updatedDocument)
          .then(response => {
            const sleep = duration =>
              new Promise(resolve => setTimeout(resolve, duration));
            // Poll document data until the status_data is 111 (error) or
            // 2 and labeling is available (done)
            const pollUntilLabelingAvailable = duration => {
              return this.$store
                .dispatch("document/updateDocument", {})
                .then(async () => {
                  if (
                    this.selectedDocument.status_data === 2 &&
                    this.selectedDocument.labeling_available === 1
                  ) {
                    // set to null so DocumentLabelSets can reset it when watching
                    // the new groupedAnnotationSets
                    setTimeout(async () => {
                      await this.$store.dispatch(
                        "document/setActiveAnnotationSet",
                        null
                      );
                      await this.$store.dispatch("document/fetchAnnotations");
                      return true;
                    }, 5000);
                  } else if (this.selectedDocument.status_data === 111) {
                    return false;
                  } else {
                    return sleep(duration).then(() =>
                      pollUntilLabelingAvailable(duration)
                    );
                  }
                });
            };

            // Check if the response is successfull or not
            if (response) {
              pollUntilLabelingAvailable(5000);
            } else {
              this.handleShowError();
              this.handleMessage(this.$i18n.t("edit_error"));
            }
          })
          .catch(error => {
            console.log(error);
            this.handleShowError();
            this.handleMessage(this.$i18n.t("edit_error"));
          })
          .finally(async () => {
            // Stop loading
            await this.$store.dispatch("document/endLoading");
            await this.$store.dispatch("document/endRecalculatingAnnotations");
          });
      }

      // Close edit mode
      this.closeEditMode();
    }
  }
};
</script>
