<template>
  <div class="top-bar">
    <ActionButtons
      :finish-review-btn="finishReviewBtn"
      :finish-disabled="finishDisabled"
      :is-loading="isLoading"
      @finish-review="handleFinishReview"
    />
  </div>
</template>

<script>
/**
 * This component is the container for annotations top bar actions
 */

import { mapState } from "vuex";
import ActionButtons from "./ActionButtons";

export default {
  name: "AnnotationsTopBar",
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
    ...mapState("document", ["publicView", "finishedReview"]),
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

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
