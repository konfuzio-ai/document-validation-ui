<style scoped lang="scss" src="../../assets/scss/variables.scss"></style>

<template>
  <b-message>
    <div class="message-container">
      {{ message }}
    </div>
    <div @click="handleErrorClose" class="btn-container">
      <b-icon icon="xmark" class="close-btn error-icon" />
    </div>
  </b-message>
</template>

<script>
export default {
  name: "ErrorMessage",
  methods: {
    handleErrorClose() {
      this.$emit("close-error");
    }
  },
  props: {
    message: {
      type: String
    }
  }
};
</script>
