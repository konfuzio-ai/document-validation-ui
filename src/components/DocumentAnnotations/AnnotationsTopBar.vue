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
import ActionButtons from "./ActionButtons";

export default {
  name: "AnnotationsTopBar",
  components: {
    ActionButtons
  },
  data() {
    return {
      finishReviewBtn: true,
      finishDisabled: true
    };
  },
  methods: {
    handleFinishReview() {
      // send request to API
      // is_reviewed=true
    },
    handleButton() {
      // check if all annotations have been reviewed
      // enable button
      // this.finishDisabled = false;
    }
  }
};
</script>
