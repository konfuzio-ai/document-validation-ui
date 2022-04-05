<template>
  <DashboardDocument class="dashboard-component" />
</template>

<script>
import DashboardDocument from "./DashboardDocument.vue";

export default {
  name: "App",
  components: {
    DashboardDocument
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
