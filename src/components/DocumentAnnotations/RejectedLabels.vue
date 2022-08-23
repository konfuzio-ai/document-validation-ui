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
          attached
          closable
          aria-close-label="Close tag"
          @close="removeRejectedLabel(missingAnnotation.id)"
        >
          <span class="label-name">
            {{ getLabelName(missingAnnotation.label) }}
          </span>
        </b-tag>
      </b-taglist>
    </section>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "RejectedLabels",
  props: {
    missingAnnotations: {
      type: Array
    }
  },
  computed: {
    ...mapState("document", ["labels"])
  },
  methods: {
    removeRejectedLabel(id) {
      this.$emit("remove-label", id);

      this.$store.dispatch("document/deleteMissingAnnotation", id);
    },
    getLabelName(label) {
      if (!this.labels) return;

      const found = this.labels.find(l => l.id === label);

      if (found) {
        return found.name;
      }
    }
  }
};
</script>
