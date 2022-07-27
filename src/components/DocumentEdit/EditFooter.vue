<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="edit-footer">
    <p>{{ $t("rotate_all") }}</p>
    <div class="buttons-container">
      <div class="action-icon" @click="rotateLeft">
        <b-icon icon="arrow-rotate-left" class="is-small" />
      </div>
      <div class="action-icon" @click="rotateRight">
        <b-icon icon="arrow-rotate-right" class="is-small" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EditFooter",
  data() {
    return {};
  },
  methods: {
    rotateLeft() {
      this.$emit("rotate-left");
    },
    rotateRight() {
      this.$emit("rotate-right");
    }
  }
};
</script>
