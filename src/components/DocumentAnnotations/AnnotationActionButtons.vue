<template>
  <div class="action-buttons">
    <!-- loading -->
    <div v-if="isLoading">
      <b-notification :closable="false" class="loading-background">
        <b-loading :active="isLoading" :is-full-page="false">
          <b-icon icon="spinner" class="fa-spin loading-icon-size spinner" />
        </b-loading>
      </b-notification>
    </div>

    <!-- save button -->
    <b-button
      v-if="saveBtn && !isLoading && !publicView && !isDocumentReviewed"
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
      v-if="cancelBtn && !isLoading && !isDocumentReviewed"
      class="is-small annotation-cancel-btn"
      icon-left="xmark"
      @click.stop="cancel"
    />

    <!-- decline button -->
    <div
      v-if="
        declineBtn &&
        !isLoading &&
        !saveBtn &&
        !cancelBtn &&
        !publicView &&
        !isDocumentReviewed
      "
      class="decline-button-container"
    >
      <b-button
        type="is-ghost"
        class="decline-btn"
        @click.stop="decline"
      >
        {{ $t("decline") }}
      </b-button>
    </div>

    <!-- accept button -->
    <b-button
      v-if="
        acceptBtn &&
        !isLoading &&
        !saveBtn &&
        !cancelBtn &&
        !publicView &&
        !isDocumentReviewed
      "
      class="annotation-accept-btn primary-button"
      type="is-primary"
      @click.stop="accept"
    >
      {{ $t("accept") }}
    </b-button>

    <!-- missing button -->
    <div
      v-if="
        showMissingBtn &&
        !isLoading &&
        !cancelBtn &&
        !saveBtn &&
        !publicView &&
        !isDocumentReviewed
      "
      class="missing-button-container"
    >
      <b-button
        type="is-ghost"
        class="missing-btn"
        @click.stop="markAsMissing"
      >
        {{ $t("missing_annotation") }}
      </b-button>
    </div>

    <!-- Restore not found annotations -->
    <b-button
      v-if="restoreBtn && !isLoading && !publicView && !isDocumentReviewed"
      class="restore-btn"
      type="is-primary"
      @click.stop="restore"
    >
      {{ $t("restore") }}
    </b-button>
  </div>
</template>
<script>
/* Component for showing actions for each annotation row */
import { mapGetters, mapState } from "vuex";
export default {
  name: "AnnotationActionButtons",
  props: {
    saveBtn: {
      type: Boolean,
    },
    cancelBtn: {
      type: Boolean,
    },
    showMissingBtn: {
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
  computed: {
    ...mapState("document", ["publicView", "missingAnnotations"]),
    ...mapGetters("document", ["isDocumentReviewed"]),
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
    markAsMissing() {
      this.$emit("mark-as-missing");
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
