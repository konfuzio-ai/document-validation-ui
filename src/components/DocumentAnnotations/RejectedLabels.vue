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
    <section class="rejected-tag-container">
      <b-taglist
        v-for="missingAnnotation in missingAnnotations"
        :key="missingAnnotation.id"
      >
        <b-tag
          attached
          closable
          aria-close-label="Close tag"
          @close="removeRejectedLabel(missingAnnotation.id)"
          :class="[
            isLoading && closedTag === missingAnnotation.id && 'loading-active'
          ]"
        >
          <span
            :class="[
              'label-name',
              isLoading && closedTag === missingAnnotation.id && 'loading'
            ]"
          >
            {{ getLabelName(missingAnnotation.label) }}
          </span>
        </b-tag>
        <div class="tag-loading-container">
          <ActionButtons
            :isLoading="isLoading && closedTag === missingAnnotation.id"
          />
        </div>
      </b-taglist>
    </section>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ActionButtons from "./ActionButtons.vue";

export default {
  name: "RejectedLabels",
  props: {
    missingAnnotations: {
      type: Array
    }
  },
  data() {
    return {
      isLoading: false,
      closedTag: null
    };
  },
  computed: {
    ...mapState("document", ["labels"])
  },
  methods: {
    removeRejectedLabel(id) {
      this.isLoading = true;
      this.closedTag = id;

      this.$store
        .dispatch("document/deleteMissingAnnotation", id)
        .then(response => {
          if (response) {
            this.$store.dispatch("document/fetchMissingAnnotations");
          } else {
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("ann_exists")
            );
          }
        })
        .finally(() => {
          this.isLoading = false;
          this.closedTag = null;
        });
    },
    getLabelName(label) {
      if (!this.labels) return;
      const found = this.labels.find(l => l.id === label);
      if (found) {
        return found.name;
      }
    }
  },
  components: { ActionButtons }
};
</script>
