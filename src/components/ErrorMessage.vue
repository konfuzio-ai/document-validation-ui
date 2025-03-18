<template>
  <b-message>
    <div v-if="serverError" class="message-container">
      <span class="server-error">
        {{ errorMessage }}
      </span>
    </div>
    <div v-else class="message-container">
      {{ errorMessage }}
    </div>
    <div class="btn-container" type="button" @click="handleErrorClose">
      <b-icon icon="xmark" class="close-btn error-icon" size="is-small" />
    </div>
  </b-message>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "ErrorMessage",
  computed: {
    ...mapState("document", ["errorMessage", "serverError"]),
  },
  methods: {
    handleErrorClose() {
      this.$store.dispatch("document/setErrorMessage", null);
    },
  },
};
</script>

<style scoped lang="scss" src="../assets/scss/variables.scss"></style>
