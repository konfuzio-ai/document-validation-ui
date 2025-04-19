<template>
  <div class="dv-ui-app-container dv-ui-theme">
    <DocumentsList v-if="showDocumentsList" />
    <DocumentDashboard v-if="!pageError" />
    <ErrorPage v-else :error="pageError" />
  </div>
</template>
<script>
import Vue from "vue";
import { mapState } from "vuex";
import * as Sentry from "@sentry/vue";
import DocumentDashboard from "./DocumentDashboard";
import ErrorPage from "./ErrorPage";
import { DocumentsList } from "./DocumentsList";
import {
  getURLQueryParam,
  getURLPath,
  getURLValueFromHash,
} from "../utils/utils";
import { Integrations } from "@sentry/tracing";
import API from "../api";
import { initKeycloak } from "../utils/keycloak";
import { debounce } from "../utils/utils";

export default {
  name: "App",
  components: {
    DocumentsList,
    DocumentDashboard,
    ErrorPage,
  },
  props: {
    document: {
      type: String,
      required: false,
      default: null,
    },
    // eslint-disable-next-line vue/prop-name-casing
    user_token: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    full_mode: {
      type: String,
      required: false,
      default: "false",
    },
    // eslint-disable-next-line vue/prop-name-casing
    show_documents_navigation: {
      type: String,
      required: false,
      default: "true",
    },
    // eslint-disable-next-line vue/prop-name-casing
    show_missing_annotations: {
      type: String,
      required: false,
      default: "true",
    },
    // eslint-disable-next-line vue/prop-name-casing
    show_feedback_needed_annotations: {
      type: String,
      required: false,
      default: "true",
    },
    // eslint-disable-next-line vue/prop-name-casing
    show_accepted_annotations: {
      type: String,
      required: false,
      default: "true",
    },
    // eslint-disable-next-line vue/prop-name-casing
    sentry_dsn: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    sentry_env: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    api_url: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    image_url: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/require-default-prop
    locale: {
      type: String,
      required: false,
    },
    // eslint-disable-next-line vue/prop-name-casing
    documents_list_path: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    details_url: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    annotation: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    annotationSet: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    sso_url: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    sso_realm: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    sso_client_id: {
      type: String,
      required: false,
      default: "",
    },
    // eslint-disable-next-line vue/prop-name-casing
    hide_empty_label_sets: {
      type: String,
      required: false,
      default: "false",
    },
    // eslint-disable-next-line vue/prop-name-casing
    annotation_content_width: {
      type: String,
      required: false,
      default: "60",
    },
    // eslint-disable-next-line vue/prop-name-casing
    remove_branding: {
      type: String,
      required: false,
      default: "false",
    },
  },
  computed: {
    ...mapState("display", ["pageError"]),
    documentId() {
      if (getURLQueryParam("document")) {
        return getURLQueryParam("document");
      } else if (getURLPath("d")) {
        return getURLPath("d");
      } else if (process.env.VUE_APP_DOCUMENT) {
        return process.env.VUE_APP_DOCUMENT;
      } else if (this.document) {
        return this.document;
      } else {
        return null;
      }
    },
    userToken() {
      if (process.env.VUE_APP_USER_TOKEN) {
        return process.env.VUE_APP_USER_TOKEN;
      } else if (this.user_token) {
        return this.user_token;
      } else {
        return null;
      }
    },
    fullMode() {
      if (process.env.VUE_APP_FULL_MODE) {
        return process.env.VUE_APP_FULL_MODE;
      } else if (this.full_mode && this.full_mode === "true") {
        return this.full_mode;
      } else {
        return null;
      }
    },
    showDocumentsNavigation() {
      if (process.env.VUE_APP_SHOW_DOCUMENTS_NAVIGATION) {
        return process.env.VUE_APP_SHOW_DOCUMENTS_NAVIGATION === "true";
      } else {
        return this.show_documents_navigation === "true";
      }
    },
    removeBranding() {
      if (process.env.VUE_APP_REMOVE_BRANDING) {
        return process.env.VUE_APP_REMOVE_BRANDING === "true";
      } else {
        return this.remove_branding === "true";
      }
    },
    showMissingAnnotations() {
      if (
        window.location.hash === "#unrevised" ||
        window.location.hash === "#possiblyIncorrect"
      ) {
        return false;
      } else if (process.env.VUE_APP_SHOW_MISSING_ANNOTATIONS) {
        return process.env.VUE_APP_SHOW_MISSING_ANNOTATIONS === "true";
      } else {
        return this.show_missing_annotations === "true";
      }
    },
    showAcceptedAnnotations() {
      if (
        window.location.hash === "#unrevised" ||
        window.location.hash === "#possiblyIncorrect"
      ) {
        return false;
      } else if (process.env.VUE_APP_SHOW_ACCEPTED_ANNOTATIONS) {
        return process.env.VUE_APP_SHOW_ACCEPTED_ANNOTATIONS === "true";
      } else {
        return this.show_accepted_annotations === "true";
      }
    },
    showFeedbackNeededAnnotations() {
      if (
        window.location.hash === "#unrevised" ||
        window.location.hash === "#possiblyIncorrect"
      ) {
        return true;
      } else if (process.env.VUE_APP_SHOW_FEEDBACK_NEEDED_ANNOTATIONS) {
        return process.env.VUE_APP_SHOW_FEEDBACK_NEEDED_ANNOTATIONS === "true";
      } else {
        return this.show_feedback_needed_annotations === "true";
      }
    },
    isPublicView() {
      if (
        this.userToken ||
        this.fullMode ||
        (this.ssoUrl && this.ssoRealm && this.ssoClientId)
      ) {
        return false;
      } else {
        return true;
      }
    },
    showDocumentsList() {
      return process.env.VUE_APP_SHOW_DOCUMENTS_LIST;
    },
    documentsListPath() {
      if (process.env.VUE_APP_DOCUMENTS_LIST_PATH) {
        return process.env.VUE_APP_DOCUMENTS_LIST_PATH;
      } else if (this.documents_list_path && this.documents_list_path !== "") {
        return this.documents_list_path;
      } else {
        return null;
      }
    },
    detailsUrl() {
      if (process.env.VUE_APP_DETAILS_URL) {
        return process.env.VUE_APP_DETAILS_URL;
      } else if (this.details_url) {
        return this.details_url;
      } else {
        return null;
      }
    },
    ssoUrl() {
      if (process.env.VUE_APP_SSO_URL) {
        return process.env.VUE_APP_SSO_URL;
      } else if (this.sso_url) {
        return this.sso_url;
      } else {
        return null;
      }
    },
    ssoRealm() {
      if (process.env.VUE_APP_SSO_REALM) {
        return process.env.VUE_APP_SSO_REALM;
      } else if (this.sso_realm) {
        return this.sso_realm;
      } else {
        return null;
      }
    },
    ssoClientId() {
      if (process.env.VUE_APP_SSO_CLIENT_ID) {
        return process.env.VUE_APP_SSO_CLIENT_ID;
      } else if (this.sso_client_id) {
        return this.sso_client_id;
      } else {
        return null;
      }
    },
    annotationId() {
      if (getURLValueFromHash("ann")) {
        return getURLValueFromHash("ann");
      } else if (process.env.VUE_APP_ANNOTATION) {
        return process.env.VUE_APP_ANNOTATION;
      } else if (this.annotation) {
        return this.annotation;
      } else {
        return null;
      }
    },
    annotationSetId() {
      if (getURLValueFromHash("templ")) {
        return getURLValueFromHash("templ");
      } else if (process.env.VUE_APP_ANNOTATION_SET) {
        return process.env.VUE_APP_ANNOTATION_SET;
      } else if (this.annotationSet) {
        return this.annotationSet;
      } else {
        return null;
      }
    },
    hideEmptyLabelSets() {
      if (process.env.VUE_APP_HIDE_EMPTY_LABEL_SETS) {
        return process.env.VUE_APP_HIDE_EMPTY_LABEL_SETS === "true";
      } else {
        return this.hide_empty_label_sets === "true";
      }
    },
    annotationContentWidth() {
      if (process.env.VUE_APP_ANNOTATION_CONTENT_WIDTH) {
        return process.env.VUE_APP_ANNOTATION_CONTENT_WIDTH;
      } else {
        return this.annotation_content_width;
      }
    },
  },
  async created() {
    // Sentry config
    if (process.env.NODE_ENV != "development") {
      Sentry.init({
        Vue,
        dsn: process.env.VUE_APP_SENTRY_DSN,
        integrations: [new Integrations.BrowserTracing()],
        environment: process.env.VUE_APP_SENTRY_ENV,

        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 1.0,

        // If false, errors won't show up in devtools
        logErrors: true,

        tracingOptions: {
          trackComponents: true,
        },
      });
    }

    // Log app version
    console.log(
      `${this.removeBranding ? "" : require("../../package.json").name} ${
        require("../../package.json").version
      }`
    );

    // locale config
    if (this.locale && this.locale !== "") {
      this.$i18n.locale = this.locale;
    }

    // api config
    if (this.userToken) {
      API.setAuthToken(this.userToken);
    } else if (this.ssoUrl && this.ssoRealm && this.ssoClientId) {
      await initKeycloak(this.ssoUrl, this.ssoRealm, this.ssoClientId);
    }

    API.setLocale(this.$i18n.locale);

    if (this.api_url !== "") {
      API.setApiUrl(this.api_url);
    }
    if (this.image_url !== "") {
      API.setFileUrl(this.image_url);
    }

    // document and project config
    Promise.all([
      this.$store.dispatch("display/setDetailsUrl", this.detailsUrl),
      this.$store.dispatch(
        "display/setAnnotationWidth",
        this.annotationContentWidth
      ),
      this.$store.dispatch(
        "display/hideEmptyLabelSets",
        this.hideEmptyLabelSets
      ),
      this.$store.dispatch(
        "display/showDocumentsNavigation",
        this.showDocumentsNavigation
      ),
      this.$store.dispatch("display/showBranding", !this.removeBranding),
      this.$store.dispatch(
        "document/showMissingAnnotations",
        this.showMissingAnnotations
      ),
      this.$store.dispatch(
        "document/showFeedbackNeededAnnotations",
        this.showFeedbackNeededAnnotations
      ),
      this.$store.dispatch(
        "document/showAcceptedAnnotations",
        this.showAcceptedAnnotations
      ),
      this.$store.dispatch("document/setDocId", this.documentId),
      this.$store.dispatch("document/setPublicView", this.isPublicView),
      this.$store.dispatch("document/setAnnotationId", this.annotationId),
      this.$store.dispatch("document/setAnnotationSetId", this.annotationSetId),
      this.$store.dispatch(
        "project/setDocumentsListPath",
        this.documentsListPath
      ),
    ]).finally(() => {
      this.$store.dispatch("document/fetchDocument");
    });

    // Stop error resizeObserver
    const _ = window.ResizeObserver;
    window.ResizeObserver = class ResizeObserver extends _ {
      constructor(callback) {
        callback = debounce(callback, 20);
        super(callback);
      }
    };
  },
};
</script>

<style lang="scss" src="../assets/scss/theme.scss"></style>
