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
          <template #tag="props">
            <span>{{ labelNameForAnnotationId(props.tag) || props.tag }}</span>
          </template>
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
import { mapGetters, mapState } from "vuex";
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
    ...mapGetters("document", ["annotationById", "labelOfAnnotation"]),
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
  methods: {
    labelNameForAnnotationId(annotationId) {
      const annotation = this.annotationById(Number(annotationId));
      if (annotation) {
        const label = this.labelOfAnnotation(annotation);
        if (label) {
          return label.name;
        }
      }
      return false;
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
