<template>
  <div class="action-bar">
    <div class="action-bar-elements">
      <div v-if="documentActionBar.icon" class="action-icon">
        <ActionIcon :icon="documentActionBar.icon" class="icon" />
      </div>
      <div v-if="documentActionBar.text" class="action-text">
        {{ documentActionBar.text }}
      </div>
      <div v-if="documentActionBar.action" class="action-button">
        <ActionButtons
          :save-btn="documentActionBar.action !== null"
          :is-loading="documentActionBar.loading"
          :action-bar="true"
          @save="handleSave()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ActionButtons from "../DocumentAnnotations/ActionButtons";
import ActionIcon from "../../assets/images/ActionIcon";

export default {
  name: "ActionBar",
  components: {
    ActionIcon,
    ActionButtons,
  },
  computed: {
    ...mapState("display", ["documentActionBar"]),
  },
  methods: {
    handleSave() {
      this.documentActionBar.action();
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_action_bar.scss"
></style>
