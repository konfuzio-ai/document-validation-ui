<style lang="scss" src="../assets/scss/main.scss"></style>
<template>
  <div class="app-container">
    <DocumentsList />
    <DocumentDashboard />
  </div>
</template>

<script>
import DocumentDashboard from "./DocumentDashboard";
import { DocumentsList } from "./DocumentsList";
import API from "../api";

export default {
  name: "App",
  components: {
    DocumentsList,
    DocumentDashboard
  },
  props: {
    document: {
      type: String,
      required: false
    },
    project: {
      type: String,
      required: false
    },
    user_token: {
      type: String,
      required: false
    },
    full_mode: {
      type: String,
      required: false
    },
    locale: { type: String, required: false }
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
      this.$store.dispatch("document/setPublicView", this.isPublicView)
    ]).finally(() => {
      this.$store.dispatch("document/fetchDocument");
    });
  },
  computed: {
    documentId() {
      if (process.env.VUE_APP_DOCUMENT_ID) {
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
    }
  }
};
</script>
