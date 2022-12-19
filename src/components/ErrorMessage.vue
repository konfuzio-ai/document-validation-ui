<template>
  <b-message>
    <div class="message-container">
      {{ errorMessage }}
    </div>
    <div
      class="btn-container"
      type="button"
      @click="handleErrorClose"
    >
      <b-icon
        icon="xmark"
        class="close-btn error-icon"
        size="is-small"
      />
    </div>
  </b-message>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "ErrorMessage",
  methods: {
    handleErrorClose() {
      this.$store.dispatch("document/setErrorMessage", null);
    }
  },
  computed: {
    ...mapState("document", ["errorMessage"])
  }
};
</script>

<style scoped lang="scss" src="../assets/scss/variables.scss"></style>
