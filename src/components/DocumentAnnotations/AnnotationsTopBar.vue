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
    ...mapState("document", [
      "annotations",
      "publicView",
      "annotationSets",
      "missingAnnotations",
      "labels"
    ]),

    emptyAnnotations() {
      const empty = this.annotationSets.map(annSet => {
        const labelSetId = annSet.label_set.id;
        const labels = annSet.labels.filter(
          label => label.annotations.length === 0
        );

        if (labels.length > 0) {
          return { labels: labels, labelSetId: labelSetId };
        } else {
          return [null];
        }
      });

      return empty.filter(ann => ann[0] !== null);
    }
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
    },
    isDocumentReadyForReview(label, labelSet) {
      // check if all annotations have been revised
      const notRevised = this.annotations.filter(a => !a.revised);

      // check that all empty annotations have been rejected
      const rejectedAnnotations = [];

      if (this.emptyAnnotations.length > 0) {
        if (label && labelSet) {
          this.emptyAnnotations.map(ann => {
            if (ann.labelSetId == labelSet) {
              const foundLabel = ann.labels.find(l => l.id === label);

              if (foundLabel) {
                rejectedAnnotations.push({
                  labelSet: ann.labelSetId,
                  label: foundLabel.id
                });
              }
            }
          });
        }
      }

      if (
        notRevised.length === 0 &&
        rejectedAnnotations.length === this.emptyAnnotations.length
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

      const label = newValue.map(l => {
        return l.label;
      });
      const labelSet = newValue.map(lSet => {
        return lSet.label_set;
      });

      this.isDocumentReadyForReview(label[0], labelSet);
    }
  }
};
</script>
