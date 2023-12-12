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
import { mapGetters, mapState } from "vuex";
export default {
  name: "AnnotationFilters",
  data() {
    return {
      feedbackNeeded: true,
      missingAnnotations: true,
      acceptedAnnotations: true,
    };
  },
  computed: {},
  methods: {},
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
