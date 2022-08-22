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
      v-if="cancelBtn && !isLoading"
      :class="['is-small', isActive && 'annotation-cancel-btn']"
      icon-left="xmark"
      v-on:click.stop="cancel()"
    />

    <b-button
      v-if="saveBtn && !isLoading"
      icon-left="check"
      :class="['is-small', isActive && 'annotation-save-btn']"
      type="is-primary"
      v-on:click.stop="save()"
    />

    <div v-if="menu && !isLoading" class="menu-buttons">
      <b-dropdown aria-role="list" position="is-top-left">
        <template #trigger>
          <b-icon icon="ellipsis-vertical" class="menu-icon is-small"></b-icon>
        </template>
        <b-dropdown-item aria-role="listitem" @click="handleMenu">{{
          $t("reject_label")
        }}</b-dropdown-item>
      </b-dropdown>
    </div>
  </div>
</template>
<script>
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
    annotationSet: {
      type: Object
    },
    label: {
      type: Object
    }
  },
  methods: {
    save() {
      this.$emit("save");
    },
    cancel() {
      this.$emit("cancel");
    },
    handleMenu() {
      if (!this.label || !this.annotationSet) return;

      const rejected = {
        id: Math.round(Math.random() * 1000),
        label: this.label.id,
        label_set: this.annotationSet.label_set.id
      };

      this.$emit("handle-menu", rejected);
    }
  }
};
</script>
