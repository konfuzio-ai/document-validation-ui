<template>
  <DashboardData>
    <template v-slot:document>
      <DashboardDocument class="dashboard-component" />
    </template>
  </DashboardData>
</template>

<script>
import DashboardData from "./DashboardData.vue";
import DashboardDocument from "./DashboardDocument.vue";

export default {
  name: "App",
  components: {
    DashboardData,
    DashboardDocument
  }
};
</script>
