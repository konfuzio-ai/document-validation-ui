<style lang="scss" src="./assets/scss/main.scss"></style>
<template>
  <div>
    <DocumentsList v-if="showDocumentsList" />
    <DocumentDashboard class="dashboard-component" />
  </div>
</template>

<script>
import DocumentDashboard from "./components/DocumentDashboard";
import { DocumentsList } from "./components/DocumentsList";
import store from "./store";
import { mapState } from "vuex";

export default {
  store,
  name: "App",
  components: {
    DocumentsList,
    DocumentDashboard
  },
  created() {
    // fetch info from API and save it on store
    this.documentLoading();
    if (process.env.VUE_APP_CATEGORY_ID) {
      this.categoryLoading();
    }
  },
  computed: {
    ...mapState("document", ["documentId"])
  },
  data() {
    return {
      showDocumentsList: process.env.VUE_APP_CATEGORY_ID
    };
  },
  watch: {
    documentId(value) {
      console.log("change ", value);
      this.documentLoading();
    }
  },
  methods: {
    documentLoading() {
      this.$store.dispatch("document/startLoading");
      Promise.all([
        this.$store.dispatch("document/fetchAnnotations"),
        this.$store.dispatch("document/fetchDocumentData")
      ]).finally(() => {
        this.$store.dispatch("document/endLoading");
      });
    },
    categoryLoading() {
      Promise.all([
        this.$store.dispatch("category/fetchCategory"),
        this.$store.dispatch("category/fetchDocumentList")
      ]);
    }
  }
};
</script>
