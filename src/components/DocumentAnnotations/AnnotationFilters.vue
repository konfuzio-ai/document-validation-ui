<template>
  <div id="annotation-filters">
    <b-switch v-model="annotationFilters.showFeedbackNeeded" class="is-small">{{
      $t("human_feedback_needed")
    }}</b-switch>
    <b-switch v-model="annotationFilters.showEmpty" class="is-small">{{
      $t("label_missing_annotations")
    }}</b-switch>
    <b-switch v-model="annotationFilters.showAccepted" class="is-small">{{
      $t("accepted_annotations")
    }}</b-switch>
  </div>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "AnnotationFilters",
  computed: {
    ...mapState("document", ["annotationSets", "annotationFilters"]),
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
