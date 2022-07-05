<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <div class="action-buttons">
    <b-button
      icon-left="check"
      class="is-small"
      type="is-primary"
      v-on:click="save()"
    />
    <b-button class="is-small" icon-left="xmark" v-on:click="cancel()" />
  </div>
</template>
<script>
export default {
  name: "ActionButtons",
  methods: {
    save() {
      this.$emit("save");
    },
    cancel() {
      this.$emit("cancel");
    }
  }
};
</script>
