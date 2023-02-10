<template>
  <div class="sidebar-buttons">
    <!-- Rotate buttons -->
    <div v-if="showRotateButton" class="rotate-button-container">
      <b-button
        class="rotate-button edit-mode-btn"
        :disabled="buttonDisabled"
        @click="rotateButton"
      >
        <div class="button-content">
          <b-icon :icon="icon" class="is-small" />
          <span class="button-text">{{ buttonText }}</span>
        </div>
      </b-button>
    </div>

    <!-- Splitting suggestions button-->
    <div v-if="showSplitButton" class="split-button-container">
      <b-tooltip
        :label="tooltipInfo"
        multilined
        type="is-dark"
        :active="buttonDisabled"
        size="is-large"
        position="is-left"
        class="split-tooltip"
      >
        <b-button
          class="split-button edit-mode-btn"
          :disabled="buttonDisabled"
          @click="showSplitInfoBar"
        >
          <div class="button-content">
            <MagicWandIcon />
            <span class="button-text">{{ $t("smart_split") }}</span>
            <span class="new-badge">{{ newText }}</span>
          </div>
        </b-button>
      </b-tooltip>
    </div>
  </div>
</template>

<script>
import { nextTick } from "vue";
import MagicWandIcon from "../../assets/images/MagicWandIcon.vue";

export default {
  name: "SidebarButtons",
  components: {
    MagicWandIcon,
  },
  props: {
    showRotateButton: {
      type: Boolean,
      default: false,
    },
    showSplitButton: {
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
  data() {
    return {
      newText: this.$t("new"),
    };
  },
  mounted() {
    nextTick(() => {
      if (this.newText) {
        this.newText = this.$t("new").toUpperCase();
      }
    });
  },

  methods: {
    rotateButton() {
      this.$emit("rotate");
    },
    showSplitInfoBar() {
      this.$parent.$emit("show-bar");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
