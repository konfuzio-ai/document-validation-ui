<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");

body {
  margin: 0;
  border: 1px solid $detail;
  font-family: "Inter", sans-serif;
}
</style>
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
  data() {
    return {
      showDocumentsList: process.env.VUE_APP_CATEGORY_ID
    };
  },
  methods: {
    documentLoading() {
      this.$store.dispatch("document/startLoading");
      Promise.all([this.$store.dispatch("document/fetchAnnotations")]).finally(
        () => {
          this.$store.dispatch("document/endLoading");
        }
      );
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
