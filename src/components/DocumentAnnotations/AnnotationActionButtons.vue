<template>
  <div class="action-buttons">
    <!-- label multi false nav buttons -->
    <b-tooltip
      v-if="isLabelMultiFalseAndGroupOfAnns(label) && !showSave"
      :delay="tooltipDelay"
      position="is-left"
      :label="$t('nav_label_anns')"
    >
      <div class="ann-nav-btns">
        <span>{{ label.annotations.length }}</span>
        <b-icon
          icon="angle-down"
          class="angle-icon center-icon button-icon is-link"
          @click.stop="nextAnn"
        />
      </div>
    </b-tooltip>

    <!-- link button -->
    <b-button
      v-if="showLink"
      id="annotation-link-btn"
      type="is-ghost"
      class="button-action is-button-icon"
      @click.stop="link"
    >
      <b-tooltip
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('annotation_link')"
      >
        <b-icon icon="link" class="link-icon center-icon button-icon" />
      </b-tooltip>
    </b-button>

    <!-- decline button -->
    <b-button
      v-if="showDecline"
      class="button-action is-button-icon decline-btn"
      type="is-ghost"
      @click.stop="decline"
    >
      <b-tooltip
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('decline')"
      >
        <b-icon icon="ban" class="decline-icon center-icon button-icon" />
      </b-tooltip>
    </b-button>

    <!-- accept button -->
    <b-button
      v-if="showAccept"
      :class="`button-action accept-btn ${
        showText ? 'is-button-text' : 'is-button-icon'
      }`"
      :type="showText ? 'is-primary' : 'is-ghost'"
      @click.stop="accept"
    >
      <span v-if="showText" class="button-text">{{ $t("accept") }}</span>
      <b-tooltip
        v-else
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('accept')"
      >
        <b-icon
          icon="circle-check"
          class="accept-icon center-icon button-icon"
        />
      </b-tooltip>
    </b-button>

    <!-- search button -->
    <b-button
      v-if="showSearch"
      type="is-ghost"
      :class="`button-action ${
        showText ? 'is-button-text-ghost' : 'is-button-icon'
      }`"
      @click.stop="search"
    >
      <span v-if="showText" class="button-text">{{
        $t("search_in_document")
      }}</span>
      <b-tooltip
        v-else
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('search_in_document')"
      >
        <b-icon icon="search" class="center-icon button-icon search-icon" />
      </b-tooltip>
    </b-button>

    <!-- missing button -->
    <b-button
      v-if="showMissing"
      type="is-ghost"
      :class="`button-action ${
        showText ? 'is-button-text-ghost' : 'is-button-icon'
      }`"
      @click.stop="markAsMissing"
    >
      <span v-if="showText" class="button-text">{{
        $t("missing_annotation")
      }}</span>
      <b-tooltip
        v-else
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('missing_annotation')"
      >
        <b-icon
          icon="magnifying-glass-minus"
          class="center-icon button-icon missing-icon"
        />
      </b-tooltip>
    </b-button>

    <!-- save button -->
    <b-button
      v-if="showSave"
      id="save-ann"
      :class="`button-action ${showText ? 'is-button-text' : 'is-button-icon'}`"
      :type="showText ? 'is-primary' : 'is-ghost'"
      @click.stop="save"
    >
      <span v-if="showText" class="button-text">{{ $t("save") }}</span>
      <b-tooltip
        v-else
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('save')"
      >
        <b-icon icon="floppy-disk" class="button-icon center-icon save-icon" />
      </b-tooltip>
    </b-button>

    <!-- Restore not found annotations -->
    <b-button
      v-if="showRestore"
      :class="`button-action restore-btn ${
        showText ? 'is-button-text' : 'is-button-icon'
      }`"
      :type="showText ? 'is-primary' : 'is-ghost'"
      @click.stop="restore"
    >
      <span v-if="showText" class="button-text">{{ $t("restore") }}</span>
      <b-tooltip
        v-else
        :delay="tooltipDelay"
        position="is-left"
        :label="$t('restore')"
      >
        <b-icon
          icon="trash-arrow-up"
          class="center-icon button-icon restore-icon"
        />
      </b-tooltip>
    </b-button>

    <!-- cancel button -->
    <b-button
      v-if="showCancel"
      class="button-action is-button-icon"
      :title="$t('cancel')"
      type="is-ghost"
      @click.stop="cancel"
    >
      <b-icon icon="xmark" class="cancel-icon center-icon button-icon" />
    </b-button>

    <!-- loading -->
    <b-icon v-if="isLoading" icon="spinner" class="fa-spin spinner-icon" />
  </div>
</template>
<script>
/* Component for showing actions for each annotation row */
import { mapGetters, mapState } from "vuex";
import { TEXT_BREAKPOINT_WIDTH } from "../../constants";
export default {
  name: "AnnotationActionButtons",
  props: {
    annotation: {
      type: Object,
      default: null,
    },
    label: {
      type: Object,
      default: null,
    },
    isLoading: {
      type: Boolean,
    },
    showSave: {
      type: Boolean,
    },
    showCancel: {
      type: Boolean,
    },
    showMissing: {
      type: Boolean,
    },
    showAccept: {
      type: Boolean,
    },
    showDecline: {
      type: Boolean,
    },
    showRestore: {
      type: Boolean,
    },
    showLink: {
      type: Boolean,
    },
    showSearch: {
      type: Boolean,
    },
  },
  data() {
    return {
      tooltipDelay: 700,
      showText: window.innerWidth > TEXT_BREAKPOINT_WIDTH,
    };
  },
  computed: {
    ...mapState("document", ["publicView"]),
    ...mapGetters("document", [
      "isDocumentReviewed",
      "isLabelMultiFalseAndGroupOfAnns",
    ]),
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

  unmounted() {
    window.removeEventListener("resize", this.resize);
  },
  methods: {
    resize() {
      this.showText = window.innerWidth > TEXT_BREAKPOINT_WIDTH;
    },
    search() {
      this.$emit("search");
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
    link() {
      this.$emit("link");
    },
    nextAnn() {
      this.$store.dispatch(
        "document/putNextAnnotationInLabelFirst",
        this.label
      );
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/annotation_action_buttons.scss"
></style>
