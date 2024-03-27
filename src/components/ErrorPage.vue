<template>
  <div class="error-page">
    <b-icon icon="circle-exclamation" size="is-large" class="error-icon" />
    <h1>
      {{ $t("document_error_title") }}
    </h1>
    <h2>
      {{ error ? error : "" }}
    </h2>
  </div>
</template>

<script>
export default {
  name: "ErrorPage",
  props: {
    error: {
      type: String,
      required: false,
      default: null,
    },
  },
};
</script>

<style scoped lang="scss" src="../assets/scss/error_page.scss"></style>
