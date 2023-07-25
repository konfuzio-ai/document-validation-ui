<template>
  <div class="dv-ui-app-container dv-ui-theme">
    <DocumentsList v-if="showDocumentsList" />
    <DocumentDashboard />
  </div>
</template>
<script>
import Vue from "vue";
import * as Sentry from "@sentry/vue";
import DocumentDashboard from "./DocumentDashboard";
import { DocumentsList } from "./DocumentsList";
import { getURLQueryParam, getURLPath } from "../utils/utils";
import { Integrations } from "@sentry/tracing";
import API from "../api";

export default {
  name: "App",
  components: {
    DocumentsList,
    DocumentDashboard,
  },
  props: {
    document: {
      type: String,
      required: false,
      default: null,
    },
    project: {
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
  },
  computed: {
    documentId() {
      if (getURLQueryParam("document")) {
        return getURLQueryParam("document");
      } else if (getURLPath("d")) {
        return getURLPath("d");
      } else if (process.env.VUE_APP_DOCUMENT_ID) {
        return process.env.VUE_APP_DOCUMENT_ID;
      } else if (this.document) {
        return this.document;
      } else {
        return null;
      }
    },
    projectId() {
      if (process.env.VUE_APP_PROJECT_ID) {
        return process.env.VUE_APP_PROJECT_ID;
      } else if (this.project) {
        return this.project;
      } else {
        return null;
      }
    },
    userToken() {
      if (process.env.VUE_APP_GUEST_USER_TOKEN) {
        return process.env.VUE_APP_GUEST_USER_TOKEN;
      } else if (this.user_token) {
        return this.user_token;
      } else {
        return null;
      }
    },
    isPublicView() {
      if (this.userToken || (this.full_mode && this.full_mode === "true")) {
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
  },
  created() {
    // Sentry config
    if (process.env.NODE_ENV != "development") {
      Sentry.init({
        Vue,
        dsn: process.env.VUE_APP_SENTRY_DSN,
        integrations: [new Integrations.BrowserTracing()],
        environment: process.env.VUE_APP_SENTRY_ENVIRONMENT,

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

    // locale config
    if (this.locale && this.locale !== "") {
      this.$i18n.locale = this.locale;
    }

    // api config
    API.setAuthToken(this.userToken);
    API.setLocale(this.$i18n.locale);

    if (this.api_url !== "") {
      API.setApiUrl(this.api_url);
    }
    if (this.image_url !== "") {
      API.setImageUrl(this.image_url);
    }

    // document and project config
    Promise.all([
      this.$store.dispatch("project/setProjectId", this.projectId),
      this.$store.dispatch("document/setDocId", this.documentId),
      this.$store.dispatch("document/setPublicView", this.isPublicView),
      this.$store.dispatch(
        "project/setDocumentsListPath",
        this.documentsListPath
      ),
    ]).finally(() => {
      this.$store.dispatch("document/fetchDocument");
    });

    // Add observer for class added to HTML tag when Buefy modals are mounted
    // TODO: check defaultModalScroll property in Buefy constructor https://buefy.org/documentation/constructor-options
    const htmlTag = document.documentElement;
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === "class") {
          const classToRemove = "is-clipped";
          if (mutation.target.classList.contains(classToRemove)) {
            htmlTag.classList.remove(classToRemove);
          }
        }
      });
    });
    observer.observe(htmlTag, { attributes: true });
  },
};
</script>

<style lang="scss" src="../assets/scss/theme.scss"></style>
