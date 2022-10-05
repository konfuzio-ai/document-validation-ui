<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
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
      class="button-next"
      @click="handleButton"
    />
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "DocumentTopBarButtons",
  computed: {
    ...mapState("document", ["selectedDocument"]),
    ...mapState("edit", ["editMode", "splitOverview", "updatedDocument"])
  },
  methods: {
    /** EDIT MODE */
    showError() {
      this.$store.dispatch("document/setErrorMessage", this.$t("edit_error"));
    },
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
          .then(async response => {
            await this.$store.dispatch("document/setPages", []);
            const sleep = duration =>
              new Promise(resolve => setTimeout(resolve, duration));
            // Poll document data until the status_data is 111 (error) or
            // 2 and labeling is available (done)
            const pollUntilLabelingAvailable = duration => {
              return this.$store
                .dispatch("document/fetchDocumentData")
                .then(async () => {
                  if (
                    this.selectedDocument.status_data === 2 &&
                    this.selectedDocument.labeling_available === 1
                  ) {
                    // set to null so DocumentLabelSets can reset it when watching
                    // the new groupedAnnotationSets
                    setTimeout(async () => {
                      await this.$store.dispatch(
                        "document/setAnnotationSets",
                        null
                      );
                      await this.$store.dispatch("document/fetchAnnotations");
                      return true;
                    }, 5000);
                  } else if (this.selectedDocument.status_data === 111) {
                    this.$store.dispatch("document/setDocumentError", true);
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
              this.showError();
            }
          })
          .catch(error => {
            console.log(error);
            this.showError();
          })
          .finally(async () => {
            // Stop document loading state and recalculating annotations
            await this.$store.dispatch("document/endLoading");
            await this.$store.dispatch("document/endRecalculatingAnnotations");

            // set loading for images
            this.$store.dispatch("document/setImageLoaded", false);
          });
      }

      // Close edit mode
      this.closeEditMode();
    }
  }
};
</script>
