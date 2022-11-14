<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="action-buttons">
    <!-- loading -->
    <div v-if="isLoading && !finishReviewBtn">
      <b-notification :closable="false" class="loading-background">
        <b-loading :is-full-page="loadingOnFullPage" v-model="isLoading">
          <b-icon icon="spinner" class="fa-spin loading-icon-size spinner">
          </b-icon>
        </b-loading>
      </b-notification>
    </div>

    <!-- save button -->
    <b-button
      v-if="saveBtn && !isLoading"
      class="annotation-save-btn text-btn"
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

    <!-- accept button -->
    <b-button
      v-if="acceptBtn && !isLoading && !saveBtn && !cancelBtn"
      class="annotation-accept-btn"
      type="is-primary"
      @click.stop="accept"
      >{{ $t("accept") }}</b-button
    >

    <!-- reject button -->
    <div
      class="reject-button-container"
      v-if="showReject && !isLoading && !cancelBtn && !saveBtn"
    >
      <b-button type="is-ghost" class="reject-btn" @click.stop="reject">
        {{ $t("reject_label") }}
      </b-button>
    </div>

    <!-- reject all labels -->
    <div
      :class="['reject-button-container', 'reject-all']"
      v-if="rejectAllEmptyBtn && !isLoading && !cancelBtn && !saveBtn"
      @mouseenter="hoverEmptyLabels"
      @mouseleave="leaveEmptyLabels"
    >
      <b-button
        type="is-ghost"
        class="reject-btn"
        @click.stop="rejectAllEmpty"
        :disabled="emptyLabelsLength(annotationSet) === 0"
      >
        {{ $t("reject_all_empty") }} ({{ emptyLabelsLength(annotationSet) }})
      </b-button>
    </div>

    <!-- finish review button -->
    <b-button
      v-if="finishReviewBtn"
      :class="['finish-review-btn', 'text-btn']"
      type="is-primary"
      :disabled="finishDisabled"
      @click.stop="finishReview"
    >
      <span v-if="!isLoading">
        {{ $t("finish_review") }}
      </span>

      <div v-else>
        <b-notification :closable="false" :class="['loading-background']">
          <b-loading :is-full-page="loadingOnFullPage" v-model="isLoading">
            <b-icon icon="spinner" class="fa-spin loading-icon-size spinner">
            </b-icon>
          </b-loading>
        </b-notification>
      </div>
    </b-button>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
export default {
  name: "ActionButtons",
  data() {
    return {
      loadingOnFullPage: false
    };
  },
  props: {
    saveBtn: {
      type: Boolean
    },
    cancelBtn: {
      type: Boolean
    },
    showReject: {
      type: Boolean
    },
    isLoading: {
      type: Boolean
    },
    acceptBtn: {
      type: Boolean
    },
    finishReviewBtn: {
      type: Boolean
    },
    finishDisabled: {
      type: Boolean
    },
    handleReject: {
      type: Function
    },
    rejectAllEmptyBtn: {
      type: Boolean
    },
    annotationSet: {
      type: Object
    }
  },
  computed: {
    ...mapState("document", ["publicView", "missingAnnotations"]),
    ...mapGetters("document", ["emptyLabelsLength"])
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
      this.$parent.$emit("reject");
    },
    hoverEmptyLabels() {
      this.$emit("hover-empty-labels");
    },
    leaveEmptyLabels() {
      this.$emit("leave-empty-labels");
    },
    rejectAllEmpty() {
      this.$emit("reject-all-empty");
    },
    finishReview() {
      this.$emit("finish-review");
    }
  }
};
</script>
