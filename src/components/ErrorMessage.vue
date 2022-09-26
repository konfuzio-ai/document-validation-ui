<style scoped lang="scss" src="../assets/scss/variables.scss"></style>

<template>
  <b-message>
    <div class="message-container">
      {{ errorMessage }}
    </div>
    <div @click="handleErrorClose" class="btn-container">
      <b-icon icon="xmark" class="close-btn error-icon" />
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
