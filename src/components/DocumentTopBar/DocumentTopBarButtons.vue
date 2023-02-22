<template>
  <div class="buttons">
    <div v-if="editMode" class="edit-mode-buttons">
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

    <div
      v-if="!editMode && !selectedDocument.is_reviewed && !publicView"
      class="finish-review-button-container"
    >
      <ActionButtons
        :finish-review-btn="annotationSets && annotationSets.length > 0"
        :finish-disabled="finishDisabled"
        :is-loading="isLoading"
        @finish-review="handleFinishReview"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ActionButtons from "../DocumentAnnotations/ActionButtons";

export default {
  name: "DocumentTopBarButtons",
  components: {
    ActionButtons,
  },
  data() {
    return {
      finishReviewBtn: true,
      finishDisabled: true,
      emptyLabels: null,
      isLoading: false,
    };
  },

  computed: {
    ...mapState("document", [
      "selectedDocument",
      "publicView",
      "finishedReview",
      "annotationSets",
    ]),
    ...mapState("edit", ["editMode", "splitOverview", "updatedDocument"]),
  },

  watch: {
    finishedReview(newValue) {
      if (newValue) {
        this.finishDisabled = false;
      } else {
        this.finishDisabled = true;
      }
    },
    publicView(newValue) {
      if (newValue) {
        this.finishDisabled = true;
      }
    },
  },
  mounted() {
    this.finishDisabled = !this.finishedReview;
  },
  methods: {
    /** EDIT MODE */
    closeEditMode() {
      this.$store.dispatch("edit/disableEditMode");
      this.$store.dispatch("edit/setSplitOverview", false);
      this.$store.dispatch("edit/setUpdatedDocument", null);
      this.$store.dispatch("edit/setSelectedPages", null);
      this.$nextTick(() => {
        // reset to first page
        this.$store.dispatch("display/updateCurrentPage", 1);
      });
    },
    handleButton() {
      // Check if we are not in the split overview
      // and if we have a split document
      if (
        !this.splitOverview &&
        this.updatedDocument &&
        this.updatedDocument.length > 1
      ) {
        // Enable the "next" button to go to the overview
        this.$store.dispatch("edit/setSplitOverview", true);
        this.$store.dispatch("edit/setSelectedPages", null);
      }

      // If we are in the overview (so more than 1 doc)
      // or in the edit mode (only 1 doc)
      else if (this.updatedDocument) {
        // Send update request to the backend
        this.$store
          .dispatch("edit/editDocument", this.updatedDocument)
          .catch((error) => {
            this.$store.dispatch("document/createErrorMessage", {
              error,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          });

        // Close edit mode
        this.closeEditMode();
      }
    },
    handleFinishReview() {
      // update document
      const updatedDocumentReviewStatus = {
        is_reviewed: true,
      };

      this.isLoading = true;

      this.$store
        .dispatch("document/updateDocument", updatedDocumentReviewStatus)
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("review_error"),
          });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>
