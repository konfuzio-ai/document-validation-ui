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
    />
  </div>
</template>

<script>
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
      emptyLabels: null
    };
  },
  computed: {
    ...mapState("document", ["annotations", "publicView", "emptyAnnotations"])
  },
  methods: {
    handleFinishReview() {
      // update document
      const updatedDocumentReviewStatus = {
        is_reviewed: true
      };

      this.$store
        .dispatch("document/updateDocument", updatedDocumentReviewStatus)
        .then(response => {
          if (response) {
            // Poll document data until the status_data is 111 (error) or
            // 2 and labeling is available (done)
            this.$store.dispatch("document/pollDocumentEndpoint", 5000);
          } else {
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("review_error")
            );
          }
        });
    }
  },
  watch: {
    annotations(newValue) {
      if (!newValue) return;

      // Check if there are annotations that have not been revised
      const notRevised = newValue.filter(a => !a.revised);

      if (notRevised.length === 0 && !this.emptyAnnotations) {
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
    emptyAnnotations(newValue) {
      if (newValue) {
        this.finishDisabled = true;
      } else {
        this.finishDisabled = false;
      }
    }
  }
};
</script>
