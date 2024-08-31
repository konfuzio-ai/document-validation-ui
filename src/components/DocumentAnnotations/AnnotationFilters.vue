<template>
  <div class="annotation-options">
    <div id="annotation-search">
      <b-field>
        <b-taginput
          v-model="search"
          ellipsis
          icon="search"
          :placeholder="$t('search')"
        >
        </b-taginput>
      </b-field>
    </div>
    <div id="annotation-filters">
      <b-switch
        v-model="annotationFilters.showFeedbackNeeded"
        class="is-small"
        >{{ $t("human_feedback_needed") }}</b-switch
      >
      <b-switch v-model="annotationFilters.showEmpty" class="is-small">{{
        $t("label_missing_annotations")
      }}</b-switch>
      <b-switch v-model="annotationFilters.showAccepted" class="is-small">{{
        $t("accepted_annotations")
      }}</b-switch>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "AnnotationFilters",
  data() {
    return {
      search: [],
    };
  },
  computed: {
    ...mapState("document", [
      "annotationSets",
      "annotationFilters",
      "annotationSearch",
    ]),
  },

  watch: {
    search() {
      if (this.search.length > 0) {
        this.$emit("openAll");
      }
      if (this.search != this.annotationSearch) {
        this.$store.dispatch("document/setAnnotationSearch", this.search);
      }
    },
  },
  mounted() {
    this.search = this.annotationSearch;
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
