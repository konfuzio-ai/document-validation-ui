<template>
  <div class="sidebar-buttons">
    <!-- Rotate buttons -->
    <div v-if="showRotateButton" class="rotate-button-container">
      <b-button
        class="rotate-button edit-mode-btn primary-button"
        :disabled="buttonDisabled"
        @click="rotateButton"
      >
        <div class="button-content">
          <b-icon :icon="icon" class="is-small" />
          <span class="button-text">{{ buttonText }}</span>
        </div>
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SidebarButtons",
  props: {
    showRotateButton: {
      type: Boolean,
      default: false,
    },
    buttonDisabled: {
      type: Boolean,
      default: true,
    },
    buttonText: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    tooltipInfo: {
      type: String,
      default: null,
    },
  },

  methods: {
    rotateButton() {
      this.$emit("rotate");
    },
    handleSplittingSuggestions() {
      this.$parent.$emit("handle-splitting-suggestions");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
