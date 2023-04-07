<template>
  <div class="action-buttons">
    <!-- loading -->
    <div v-if="isLoading && !finishReviewBtn">
      <b-notification :closable="false" class="loading-background">
        <b-loading :active="isLoading" :is-full-page="loadingOnFullPage">
          <b-icon icon="spinner" class="fa-spin loading-icon-size spinner" />
        </b-loading>
      </b-notification>
    </div>

    <!-- save button -->
    <b-button
      v-if="saveBtn && !isLoading && !publicView"
      :class="[
        'annotation-save-btn text-btn',
        actionBar && 'action-bar-save-btn',
        actionBar ? 'tertiary-button' : 'primary-button',
      ]"
      type="is-primary"
      @click.stop="save"
    >
      {{ $t("save") }}
    </b-button>

    <!-- cancel button -->
    <b-button
      v-if="cancelBtn && !isLoading"
      class="is-small annotation-cancel-btn"
      icon-left="xmark"
      @click.stop="cancel"
    />

    <!-- decline button -->
    <div
      v-if="declineBtn && !isLoading && !saveBtn && !cancelBtn && !publicView"
      class="reject-decline-button-container"
    >
      <b-button
        type="is-ghost"
        class="reject-decline-btn decline-btn"
        @click.stop="decline"
      >
        {{ $t("decline") }}
      </b-button>
    </div>

    <!-- accept button -->
    <b-button
      v-if="acceptBtn && !isLoading && !saveBtn && !cancelBtn && !publicView"
      class="annotation-accept-btn primary-button"
      type="is-primary"
      @click.stop="accept"
    >
      {{ $t("accept") }}
    </b-button>

    <!-- reject button -->
    <div
      v-if="showReject && !isLoading && !cancelBtn && !saveBtn && !publicView"
      class="reject-decline-button-container"
    >
      <b-button
        type="is-ghost"
        class="reject-decline-btn reject-btn"
        @click.stop="reject"
      >
        {{ $t("reject_label") }}
      </b-button>
    </div>

    <!-- reject all labels -->
    <div
      v-if="
        !publicView && rejectAllEmptyBtn && !isLoading && !cancelBtn && !saveBtn
      "
      class="reject-decline-button-container reject-all"
      @mouseenter="mouseenterAnnotationSet('reject')"
      @mouseleave="mouseleaveAnnotationSet"
    >
      <b-button
        type="is-ghost"
        class="reject-decline-btn reject-btn reject-all-btn"
        :disabled="emptyLabelsLength(annotationSet) === 0"
        @click.stop="rejectAllEmpty"
      >
        {{ $t("reject_all_empty") }} ({{ emptyLabelsLength(annotationSet) }})
      </b-button>
    </div>

    <!-- accept all pending annotations -->
    <div
      v-if="!publicView && acceptAllBtn && !isLoading"
      class="accept-all"
      @mouseenter="mouseenterAnnotationSet('accept')"
      @mouseleave="mouseleaveAnnotationSet"
    >
      <b-button
        type="is-primary"
        class="accept-all-btn"
        :disabled="annotationsWithPendingReviewLength(annotationSet) === 0"
        @click.stop="acceptGroup"
      >
        {{ $t("accept_group") }} ({{
          annotationsWithPendingReviewLength(annotationSet)
        }})
      </b-button>
    </div>

    <!-- finish review button -->
    <b-tooltip
      :active="finishDisabled"
      position="is-bottom"
      multilined
      class="right-aligned finish-review"
    >
      <b-button
        v-if="finishReviewBtn && !publicView"
        :class="['finish-review-btn', 'text-btn', 'primary-button']"
        type="is-primary"
        :disabled="finishDisabled"
        @click.stop="finishReview"
      >
        <span v-if="!isLoading">
          {{ $t("finish_review") }}
        </span>

        <div v-else>
          <b-notification :closable="false" :class="['loading-background']">
            <b-loading :active="isLoading" :is-full-page="loadingOnFullPage">
              <b-icon
                icon="spinner"
                class="fa-spin loading-icon-size spinner"
              />
            </b-loading>
          </b-notification>
        </div>
      </b-button>

      <template #content> {{ $t("disabled_finish_review") }} </template>
    </b-tooltip>
  </div>
</template>
<script>
/* Component for showing actions for each annotation row */
import { mapState, mapGetters } from "vuex";
export default {
  name: "ActionButtons",
  props: {
    saveBtn: {
      type: Boolean,
    },
    cancelBtn: {
      type: Boolean,
    },
    showReject: {
      type: Boolean,
    },
    isLoading: {
      type: Boolean,
    },
    acceptBtn: {
      type: Boolean,
    },
    // TODO: finishReviewBtn should not be here (see comment above for purpose of this component)
    finishReviewBtn: {
      type: Boolean,
    },
    // TODO: finishDisabled should not be here
    finishDisabled: {
      type: Boolean,
    },
    // TODO: handleReject should not be here
    handleReject: {
      type: Function,
      default: null,
    },
    // TODO: rejectAllEmptyBtn should not be here
    rejectAllEmptyBtn: {
      type: Boolean,
    },
    // TODO: annotationSet should not be needed on a UI only component
    annotationSet: {
      type: Object,
      default: null,
    },
    // TODO: acceptAllBtn should not be here
    acceptAllBtn: {
      type: Boolean,
    },
    declineBtn: {
      type: Boolean,
    },
    actionBar: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      loadingOnFullPage: false,
    };
  },
  computed: {
    ...mapState("document", ["publicView", "missingAnnotations"]),
    ...mapGetters("document", [
      "emptyLabelsLength",
      "annotationsWithPendingReviewLength",
    ]),
  },
  methods: {
    save() {
      this.$emit("save");
    },
    cancel() {
      this.$emit("cancel");
    },
    accept() {
      this.$emit("accept");
    },
    reject() {
      this.$emit("reject");
    },
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
    finishReview() {
      this.$emit("finish-review");
    },
    acceptGroup() {
      this.$emit("accept-group");
    },
    decline() {
      this.$emit("decline");
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
