<script>
/**
 * This component is responsible for retrieving the pages from the PDF.js instance
 * and making API calls to the backend to fetch the necessary data to pass to its
 * children components.
 */
export default {
  name: "DashboardData",
  computed: {},

  created() {
    this.$store.dispatch("document/startLoading");
    Promise.all([
      this.$store.dispatch("document/fetchDocument"),
      this.$store.dispatch("sidebar/fetchLabels")
    ]).finally(() => {
      this.$store.dispatch("document/endLoading");
    });
  },

  render(h) {
    return h("div", [this.$scopedSlots.document({})]);
  }
};
</script>
