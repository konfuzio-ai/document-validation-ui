<template>
  <div class="action-buttons">
    <!-- mark all empty labels as missing -->
    <div
      v-if="!publicView && !documentIsReviewed"
      class="missing-decline-button-container all-missing"
      @mouseenter="mouseenterAnnotationSet('missing')"
      @mouseleave="mouseleaveAnnotationSet"
    >
      <b-button
        type="is-ghost"
        class="missing-decline-btn missing-btn all-missing-btn"
        :disabled="numberOfEmptyLabelsInAnnotationSet === 0"
        @click.stop="markAllAsMissing"
      >
        {{ $t("mark_all_missing") }} ({{ numberOfEmptyLabelsInAnnotationSet }})
      </b-button>
    </div>

    <!-- accept all pending annotations -->
    <div
      v-if="!publicView && !documentIsReviewed"
      class="accept-all"
      @mouseenter="mouseenterAnnotationSet('accept')"
      @mouseleave="mouseleaveAnnotationSet"
    >
      <b-button
        type="is-primary"
        class="accept-all-btn"
        :disabled="numberOfPendingAnnotationsInAnnotationSet === 0"
        @click.stop="acceptAllPending"
      >
        {{ $t("accept_group") }} ({{
          numberOfPendingAnnotationsInAnnotationSet
        }})
      </b-button>
    </div>
  </div>
</template>
<script>
/* Component for showing actions for each Annotation Set */

import { mapState } from "vuex";

export default {
  name: "AnnotationSetActionButtons",
  props: {
    numberOfEmptyLabelsInAnnotationSet: {
      type: Number,
    },
    numberOfPendingAnnotationsInAnnotationSet: {
      type: Number,
    },
  },
  computed: {
    ...mapState("document", ["publicView", "documentIsReviewed"]),
  },
  methods: {
    mouseenterAnnotationSet(type) {
      if (type == "missing") {
        this.$emit("hover-annotation-set-to-mark-missing");
      }

      if (type == "accept") {
        this.$emit("hover-annotation-set-to-accept");
      }
    },
    mouseleaveAnnotationSet() {
      this.$emit("leave-annotation-set-to-accept");
      this.$emit("leave-annotation-set-to-mark-missing");
    },
    markAllAsMissing() {
      this.$emit("mark-all-empty-missing");
    },
    acceptAllPending() {
      this.$emit("accept-all-pending-annotations");
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
