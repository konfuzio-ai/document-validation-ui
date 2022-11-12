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
    category: { type: String, required: false },
    locale: { type: String, required: false }
  },
  created() {
    this.$store.dispatch("document/setDocId", this.documentId);

    if (this.locale && this.locale !== "") {
      this.$i18n.locale = this.locale;
    }
    this.documentLoading();
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
    }
  },
  methods: {
    documentLoading() {
      this.$store.dispatch("document/fetchDocument");
    }
  }
};
</script>
