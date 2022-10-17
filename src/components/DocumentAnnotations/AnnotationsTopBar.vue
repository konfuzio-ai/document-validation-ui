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
    ...mapState("document", [
      "annotations",
      "publicView",
      "annotationSets",
      "missingAnnotations",
      "labels"
    ]),

    emptyAnnotations() {
      const empty = [];

      if (this.annotationSets) {
        this.annotationSets.map(annSet => {
          annSet.labels.map(label => {
            // return only labels with empty annotations
            if (label.annotations.length === 0) {
              empty.push({ label: label.id, label_set: annSet.label_set.id });
            }
          });
        });
      }

      // Remove duplicated values
      const filtered = empty.filter(
        (item, index, self) =>
          index ===
          self.findIndex(i => JSON.stringify(i) === JSON.stringify(item))
      );

      return filtered;
    }
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
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    isDocumentReadyForReview() {
      // check if all annotations have been revised
      let notRevised;

      if (this.annotations) {
        notRevised = this.annotations.filter(a => !a.revised);
      }

      // Return missing annotations array without the id,
      // to compare with the empty annotations
      let missingObjects;

      if (this.missingAnnotations) {
        missingObjects = JSON.parse(JSON.stringify(this.missingAnnotations));
      }

      // if all annotations have been revised AND all empty ones have been rejected
      // we enable the button to finish the document review
      if (
        notRevised.length === 0 &&
        missingObjects.length === this.emptyAnnotations.length
      ) {
        this.finishDisabled = false;
      } else {
        this.finishDisabled = true;
      }
    }
  },
  watch: {
    annotations(newValue) {
      if (!newValue) return;

      this.isDocumentReadyForReview();
    },
    missingAnnotations(newValue) {
      if (!newValue) return;

      this.isDocumentReadyForReview();
    },
    publicView(newValue) {
      if (newValue) {
        this.finishDisabled = true;
      }
    }
  }
};
</script>
