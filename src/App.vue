<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");

/* Theme */
:root {
  --bgColor: #f7f7f7;
  --primaryColor: #34ab7d;
  --lowOpacityPrimaryColor: rgba(52, 171, 125, 0.16);
  --hoverPrimaryColor: #3a9c76;
  --textColor: #344054;
  --secondaryTextColor: #858c9a;
  --detailColor: #e2e3e4;
  --hoverColor: #f0f0f0;
  --thumbnailSelectedColor: #2f3032;
  --documentBackgroundColor: #c7c7c7;
  --labelsBackgroundColor: #fff;
  --green: #12b76a;
  --red: #f13131;
  --yellow: #ffd600;
  --headerSize: 2px;
}

body {
  margin: 0;
  border: 1px solid var(--detailColor);
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
