<template>
  <div class="action-buttons">
    <!-- loading -->
    <div v-if="isLoading">
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

    <!-- Restore not found annotations -->
    <b-button
      v-if="restoreBtn && !isLoading && !publicView"
      class="accept-all-btn"
      type="is-primary"
      @click.stop="restore"
    >
      {{ $t("restore") }}
    </b-button>
  </div>
</template>
<script>
/* Component for showing actions for each annotation row */
import { mapState } from "vuex";
export default {
  name: "AnnotationActionButtons",
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
    declineBtn: {
      type: Boolean,
    },
    actionBar: {
      type: Boolean,
      required: false,
    },
    restoreBtn: {
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
    decline() {
      this.$emit("decline");
    },
    restore() {
      this.$emit("restore");
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
