<template>
  <div class="buttons">
    <div v-if="editMode" class="edit-mode-buttons">
      <b-button
        :label="$t('back_to_annotations')"
        class="button-cancel primary-button edit-mode-btn"
        type="is-default"
        :disabled="
          !documentHasCategory ||
          waitingForSplittingConfirmation(selectedDocument)
        "
        @click="closeEditMode"
      />

      <b-tooltip
        :active="!enableSubmit"
        position="is-bottom"
        :label="$t('select_category')"
        class="right-aligned no-right-margin"
      >
        <b-button
          :label="editMode && !renameAndCategorize ? $t('next') : $t('submit')"
          type="is-primary"
          :class="[
            'button-next primary-button edit-mode-btn',
            renameAndCategorize && 'submit-btn',
          ]"
          :disabled="renameAndCategorize && !enableSubmit"
          @click="handleButton"
        />
      </b-tooltip>
    </div>

    <div
      v-if="!editMode && !isDocumentReviewed && !publicView"
      class="finish-review-button-container"
    >
      <b-tooltip
        :active="!isReviewButtonActive"
        position="is-bottom"
        multilined
        class="right-aligned no-right-margin"
      >
        <b-button
          :class="['finish-review-btn', 'text-btn', 'primary-button']"
          type="is-primary"
          :disabled="!isReviewButtonActive"
          @click.stop="handleFinishReview"
        >
          <span v-if="!isLoading">
            {{ $t("finish_review") }}
          </span>

          <div v-else>
            <b-notification :closable="false" :class="['loading-background']">
              <b-loading :active="isLoading" :is-full-page="false">
                <b-icon
                  icon="spinner"
                  class="fa-spin loading-icon-size spinner"
                />
              </b-loading>
            </b-notification>
          </div>
        </b-button>

        <template #content> {{ $t("disabled_finish_review") }} </template>
      </b-tooltip>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";

export default {
  name: "DocumentTopBarButtons",
  data() {
    return {
      emptyLabels: null,
      isLoading: false,
      enableSubmit: false,
    };
  },

  computed: {
    ...mapState("document", [
      "selectedDocument",
      "publicView",
      "annotationSets",
      "thumbnailIsLoaded",
    ]),
    ...mapState("edit", ["editMode", "renameAndCategorize", "updatedDocument"]),
    ...mapGetters("document", [
      "isDocumentReadyToFinishReview",
      "isDocumentReviewed",
      "waitingForSplittingConfirmation",
    ]),
    ...mapGetters("edit", ["documentShouldBePostprocessed"]),
    isReviewButtonActive() {
      return this.isDocumentReadyToFinishReview;
    },
    documentHasCategory() {
      return this.selectedDocument.category;
    },
  },

  watch: {
    updatedDocument(newValue) {
      if (!newValue) return;

      this.submitValidation(newValue);
    },
  },

  mounted() {
    if (this.updatedDocument) {
      this.submitValidation(this.updatedDocument);
    }
  },

  methods: {
    submitValidation(document) {
      const found = document.find((item) => !item.category);

      if (!found) {
        this.enableSubmit = true;
      } else {
        this.enableSubmit = false;
      }
    },
    closeEditMode() {
      this.$store.dispatch("edit/disableEditMode");
      this.$store.dispatch("edit/setRenameAndCategorize", false);
      this.$store.dispatch("edit/setUpdatedDocument", null);
      this.$store.dispatch("edit/setSelectedPages", null);
      this.$nextTick(() => {
        // reset to first page
        this.$store.dispatch("display/updateCurrentPage", 1);
      });
    },
    handleButton() {
      // Check if we are not in the Rename and Categorize view
      // and if we have a split document
      if (!this.renameAndCategorize) {
        // Enable the "next" button
        this.$store.dispatch("edit/setRenameAndCategorize", true);
        this.$store.dispatch("edit/setSelectedPages", null);
      } else if (
        this.selectedDocument.category_is_revised &&
        this.documentShouldBePostprocessed
      ) {
        // Show confirmation modal to user if the document was split, reordered or rotated
        this.$store.dispatch("edit/setShowEditConfirmationModal", true);
      } else {
        this.$store.dispatch("edit/setSubmitEditChanges", true);
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
