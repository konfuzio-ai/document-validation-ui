<template>
  <div class="action-bar">
    <div class="action-bar-elements">
      <div v-if="hasIcon" class="action-icon">
        <ActionIcon :icon="icon" class="icon" />
      </div>
      <div v-if="text" class="action-text">
        {{ text }}
      </div>
      <div v-if="hasButton" class="action-button">
        <ActionButtons
          :save-btn="hasButton"
          :is-loading="isLoading"
          :action-bar="true"
          @save="handleSave()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ActionButtons from "../DocumentAnnotations/ActionButtons";
import ActionIcon from "../../assets/images/ActionIcon";

export default {
  name: "ActionBar",
  components: {
    ActionIcon,
    ActionButtons,
  },
  props: {
    hasIcon: {
      type: Boolean,
      required: false,
    },
    icon: {
      type: String,
      default: null,
      required: false,
    },
    text: {
      type: String,
      default: null,
      required: false,
    },
    hasButton: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    handleSave() {
      // TODO: implementation
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/scrolling_document.scss"
></style>
