<template>
  <div class="dv-ui-app-container dv-ui-theme">
    <DocumentsList v-if="showDocumentsList" />
    <DocumentDashboard />
  </div>
</template>
<script>
import DocumentDashboard from "./DocumentDashboard";
import { DocumentsList } from "./DocumentsList";
import { getURLQueryParam, getURLPath } from "../utils/utils";
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
    locale: {
      type: String,
      required: false,
      default: "en",
    },
  },
  computed: {
    documentId() {
      if (getURLQueryParam("document")) {
        return getURLQueryParam("document");
      } else if (getURLPath("docs")) {
        return getURLPath("docs");
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
      if (
        process.env.VUE_APP_GUEST_USER_TOKEN ||
        this.user_token ||
        (this.full_mode && this.full_mode === "true")
      ) {
        return false;
      } else {
        return true;
      }
    },
    showDocumentsList() {
      return process.env.VUE_APP_SHOW_DOCUMENTS_LIST;
    },
  },
  created() {
    // locale config
    if (this.locale && this.locale !== "") {
      this.$i18n.locale = this.locale;
    }

    // user token config
    API.setAuthToken(this.userToken);

    // document and project config
    Promise.all([
      this.$store.dispatch("project/setProjectId", this.projectId),
      this.$store.dispatch("document/setDocId", this.documentId),
      this.$store.dispatch("document/setPublicView", this.isPublicView),
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
