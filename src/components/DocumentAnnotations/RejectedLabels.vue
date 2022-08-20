<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="rejected-label-container">
    <p class="title">
      {{ `${$t("rejected")} (${missingAnnotations.length})` }}
    </p>
    <section class="tag-container">
      <b-taglist
        v-for="missingAnnotation in missingAnnotations"
        :key="missingAnnotation.id"
      >
        <b-tag
          v-if="notActive !== missingAnnotation.id || !notActive"
          attached
          closable
          aria-close-label="Close tag"
          @close="removeRejectedLabel(missingAnnotation.id)"
        >
          {{ missingAnnotation.label }}
        </b-tag>
      </b-taglist>
    </section>
  </div>
</template>

<script>
export default {
  name: "RejectedLabels",
  data() {
    return {
      notActive: null
    };
  },
  props: {
    missingAnnotations: {
      type: Array
    }
  },
  methods: {
    removeRejectedLabel(id) {
      this.$emit("remove-label", id);

      this.$store.dispatch("document/deleteMissingAnnotation", id);
    }
  }
};
</script>
