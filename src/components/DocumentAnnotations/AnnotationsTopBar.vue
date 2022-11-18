<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="top-bar">
    <ActionButtons
      :finishReviewBtn="finishReviewBtn"
      :finishDisabled="finishDisabled"
      @finish-review="handleFinishReview"
      :isLoading="isLoading"
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
    ActionButtons
  },
  data() {
    return {
      finishReviewBtn: true,
      finishDisabled: true,
      emptyLabels: null,
      isLoading: false
    };
  },
  computed: {
    ...mapState("document", ["publicView", "finishedReview"])
  },
  mounted() {
    this.finishDisabled = !this.finishedReview;
  },
  methods: {
    handleFinishReview() {
      // update document
      const updatedDocumentReviewStatus = {
        is_reviewed: true
      };

      this.isLoading = true;

      this.$store
        .dispatch("document/updateDocument", updatedDocumentReviewStatus)
        .then(response => {
          if (response === 200) {
            // Poll document data until the status_data is 111 (error) or
            // 2 and labeling is available (done)
            this.$store.dispatch("document/pollDocumentEndpoint", 1000);
          } else {
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("review_error")
            );
          }
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
  },
  watch: {
    finishedReview(newValue) {
      if (newValue) {
        this.finishDisabled = false;
      }
    },
    publicView(newValue) {
      if (newValue) {
        this.finishDisabled = true;
      }
    }
  }
};
</script>
