<template>
  <div class="action-buttons">
    <!-- loading -->
    <b-button
      v-if="linkBtn"
      type="is-ghost"
      class="link-button"
      @click="copyAnnotationLink"
    >
      <b-tooltip position="is-left" :label="$t('annotation_link')">
        <b-icon size="is-20" icon="link" />
      </b-tooltip>
    </b-button>
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
      <span v-if="showText">{{ $t("save") }}</span>
      <b-tooltip v-else position="is-left" :label="$t('save')">
        <b-icon icon="floppy-disk" size="small" class="button-icon" />
      </b-tooltip>
    </b-button>

    <!-- cancel button -->
    <b-button
      v-if="cancelBtn && !isLoading && !isDocumentReviewed"
      class="is-small annotation-cancel-btn"
      icon-left="xmark"
      @click.stop="cancel"
    />

    <div v-if="showHoverButton" class="accept-decline-container">
      <b-button
        v-if="declineBtn"
        class="decline-btn"
        :title="$t('decline')"
        type="is-ghost"
        @click.stop="decline"
      >
        <b-icon icon="xmark" size="is-20" class="decline-icon" />
      </b-button>
      <b-button
        v-if="acceptBtn"
        class="accept-btn"
        :title="$t('accept')"
        type="is-ghost"
        @click.stop="accept"
      >
        <AcceptedCheckMark />
      </b-button>
    </div>
    <!-- missing button -->
    <div
      v-if="showMissingBtn && showHoverButton"
      class="missing-button-container"
    >
      <b-button type="is-ghost" class="missing-btn" @click.stop="markAsMissing">
        <span v-if="showText">{{ $t("missing_annotation") }}</span>
        <b-tooltip v-else position="is-left" :label="$t('missing_annotation')">
          <b-icon icon="xmark" size="is-small" class="button-icon" />
        </b-tooltip>
      </b-button>
      <b-button
        type="is-ghost"
        class="search-btn"
        @click.stop="searchInDocument"
      >
        <span v-if="showText">{{ $t("search_in_document") }}</span>
        <b-tooltip v-else position="is-left" :label="$t('search_in_document')">
          <b-icon icon="search" size="is-small" class="button-icon" />
        </b-tooltip>
      </b-button>
    </div>

    <!-- Restore not found annotations -->
    <b-button
      v-if="restoreBtn && !isLoading && !publicView && !isDocumentReviewed"
      class="restore-btn"
      type="is-primary"
      @click.stop="restore"
    >
      <span v-if="showText">{{ $t("restore") }}</span>
      <b-tooltip v-else position="is-left" :label="$t('restore')">
        <b-icon icon="trash-arrow-up" size="is-small" class="button-icon" />
      </b-tooltip>
    </b-button>
  </div>
</template>
<script>
/* Component for showing actions for each annotation row */
import { mapGetters, mapState } from "vuex";
import AcceptedCheckMark from "../../assets/images/AcceptedCheckMark";
import { TEXT_BREAKPOINT_WIDTH } from "../../constants";
export default {
  name: "AnnotationActionButtons",
  components: {
    AcceptedCheckMark,
  },
  props: {
    annotation: {
      type: Object,
      default: null,
    },
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
    linkBtn: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      showText: window.innerWidth > TEXT_BREAKPOINT_WIDTH(this.$i18n.locale),
    };
  },
  computed: {
    ...mapState("document", ["publicView", "missingAnnotations"]),
    ...mapGetters("document", ["isDocumentReviewed"]),
    showHoverButton() {
      return (
        !this.isLoading &&
        !this.cancelBtn &&
        !this.saveBtn &&
        !this.publicView &&
        !this.isDocumentReviewed
      );
    },
  },
  created() {
    window.addEventListener("resize", this.resize);
  },

  destroyed() {
    window.removeEventListener("resize", this.resize);
  },
  methods: {
    copyAnnotationLink(event) {
      if (this.annotation) {
        event.stopPropagation();
        this.$store.dispatch("document/setAnnotationId", this.annotation.id);
        navigator.clipboard.writeText(window.location.href);
        this.$buefy.toast.open({
          container: "#app .dv-ui-app-container",
          message: this.$t("copied"),
        });
      }
    },
    resize() {
      this.showText =
        window.innerWidth > TEXT_BREAKPOINT_WIDTH(this.$i18n.locale);
    },
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
    searchInDocument() {
      this.$emit("search-label-in-document");
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
