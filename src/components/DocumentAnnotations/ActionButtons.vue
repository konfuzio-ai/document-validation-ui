<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="action-buttons">
    <div v-if="isLoading">
      <b-notification :closable="false" class="loading-background">
        <b-loading :is-full-page="isFullPage" v-model="isLoading">
          <b-icon icon="spinner" class="fa-spin loading-icon-size spinner">
          </b-icon>
        </b-loading>
      </b-notification>
    </div>

    <b-button
      v-if="saveBtn && !isLoading"
      :class="[isActive && 'annotation-save-btn']"
      type="is-primary"
      v-on:click.stop="save"
    >
      {{ $t("save") }}
    </b-button>

    <b-button
      v-if="cancelBtn && !isLoading"
      :class="['is-small', isActive && 'annotation-cancel-btn']"
      icon-left="xmark"
      v-on:click.stop="cancel"
    />

    <div
      v-if="showRejectedLabels && !publicView && menu && !isLoading"
      class="menu-buttons"
    >
      <b-dropdown aria-role="list" position="is-top-left" class="width-12">
        <template #trigger>
          <b-icon icon="ellipsis-vertical" class="menu-icon is-small"></b-icon>
        </template>
        <b-dropdown-item aria-role="listitem" @click.stop="handleMenu">{{
          $t("reject_label")
        }}</b-dropdown-item>
      </b-dropdown>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "ActionButtons",
  data() {
    return {
      isFullPage: false
    };
  },
  props: {
    saveBtn: {
      type: Boolean
    },
    cancelBtn: {
      type: Boolean
    },
    menu: {
      type: Boolean
    },
    isLoading: {
      type: Boolean
    },
    isActive: {
      type: Boolean
    },
    handleMenu: {
      type: Function
    }
  },
  computed: {
    ...mapState("document", ["showRejectedLabels", "publicView"])
  },
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
