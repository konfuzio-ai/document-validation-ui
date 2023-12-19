<template>
  <div id="annotation-filters">
    <b-switch v-model="feedbackNeeded" class="is-small"
      >Human Feedback needed</b-switch
    >
    <b-switch v-model="missingAnnotations" class="is-small"
      >Missing Annotations</b-switch
    >
    <b-switch v-model="acceptedAnnotations" class="is-small"
      >Accepted Annotations</b-switch
    >
  </div>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "AnnotationFilters",
  data() {
    return {
      feedbackNeeded: true,
      missingAnnotations: true,
      acceptedAnnotations: true,
      originalAnnotationSets: [],
    };
  },
  computed: {
    ...mapState("document", ["annotationSets"]),
  },
  watch: {
    feedbackNeeded() {
      this.filterAnnotations();
    },
    missingAnnotations() {
      this.filterAnnotations();
    },
    acceptedAnnotations() {
      this.filterAnnotations();
    },
  },
  mounted() {
    this.originalAnnotationSets = JSON.parse(
      JSON.stringify(this.annotationSets)
    );
  },
  methods: {
    filterAnnotations() {
      this.$store.dispatch("document/filterAnnotations", {
        originalAnnotationSets: this.originalAnnotationSets,
        showEmpty: this.missingAnnotations,
        showFeedbackNeeded: this.feedbackNeeded,
        showAccepted: this.acceptedAnnotations,
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
