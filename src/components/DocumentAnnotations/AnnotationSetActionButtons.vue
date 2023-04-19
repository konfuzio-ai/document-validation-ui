<template>
  <div class="action-buttons">
    <!-- reject all labels -->
    <div
      v-if="!publicView"
      class="reject-decline-button-container reject-all"
      @mouseenter="mouseenterAnnotationSet('reject')"
      @mouseleave="mouseleaveAnnotationSet"
    >
      <b-button
        type="is-ghost"
        class="reject-decline-btn reject-btn reject-all-btn"
        :disabled="numberOfEmptyLabelsInAnnotationSet === 0"
        @click.stop="rejectAllEmpty"
      >
        {{ $t("reject_all_empty") }} ({{ numberOfEmptyLabelsInAnnotationSet }})
      </b-button>
    </div>

    <!-- accept all pending annotations -->
    <div
      v-if="!publicView"
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
    ...mapState("document", ["publicView"]),
  },
  methods: {
    mouseenterAnnotationSet(type) {
      if (type == "reject") {
        this.$emit("hover-annotation-set-to-reject");
      }

      if (type == "accept") {
        this.$emit("hover-annotation-set-to-accept");
      }
    },
    mouseleaveAnnotationSet() {
      this.$emit("leave-annotation-set-to-accept");
      this.$emit("leave-annotation-set-to-reject");
    },
    rejectAllEmpty() {
      this.$emit("reject-all-empty");
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
