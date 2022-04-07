<template>
  <DocumentDashboard class="dashboard-component" />
</template>

<script>
import DocumentDashboard from "./components/DocumentDashboard";

export default {
  name: "App",
  components: {
    DocumentDashboard
  },
  created() {
    // fetch info from API and save it on store
    this.$store.dispatch("document/startLoading");
    Promise.all([
      this.$store.dispatch("document/fetchDocument"),
      this.$store.dispatch("sidebar/fetchLabels")
    ]).finally(() => {
      this.$store.dispatch("document/endLoading");
    });
  }
};
</script>
