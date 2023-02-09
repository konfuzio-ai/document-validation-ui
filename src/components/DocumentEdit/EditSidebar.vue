<template>
  <div class="edit-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">
        {{ $t("edit_document") }}
      </h3>
      <p class="description">
        {{ $t("edit_early_access") }}
      </p>
      <p class="description">
        {{ $t("select_pages") }}
      </p>
    </div>

    <div class="buttons-container">
      <div class="rotate-selected edit-buttons">
        <p :class="['pages-selected', buttonDisabled && 'disabled']">
          {{ selectedPages.length }} {{ $t("selected") }}
        </p>

        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="buttonDisabled"
          :button-text="$t('rotate_selected')"
          :icon="'arrow-rotate-left'"
          @rotate="rotateLeft"
        />

        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="buttonDisabled"
          :button-text="$t('rotate_selected')"
          :icon="'arrow-rotate-right'"
          @rotate="rotateRight"
        />
      </div>

      <div class="rotate-all edit-buttons">
        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="false"
          :button-text="$t('rotate_all')"
          :icon="'arrow-rotate-left'"
          @rotate="rotateAllLeft"
        />

        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="false"
          :button-text="$t('rotate_all')"
          :icon="'arrow-rotate-right'"
          @rotate="rotateAllRight"
        />
      </div>

      <div class="split edit-buttons">
        <SidebarButtons
          :show-split-button="true"
          :button-disabled="!documentHasSplittingSuggestions"
          :button-text="$t('rotate_all')"
          :icon="'arrow-rotate-right'"
          :tooltip-info="tooltipInfo"
          @rotate="rotateAllRight"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SidebarButtons from "./SidebarButtons";

/**
 * This component renders buttons to rotate single pages or all pages
 * in edit mode
 * */

import { mapState } from "vuex";

export default {
  name: "EditSidebar",
  components: {
    SidebarButtons,
  },
  data() {
    return {
      buttonDisabled: true,
      documentHasSplittingSuggestions: true,
      tooltipInfo: null,
    };
  },
  computed: {
    ...mapState("edit", ["selectedPages"]),
  },
  watch: {
    selectedPages(newValue) {
      if (newValue.length > 0) {
        this.buttonDisabled = false;
      } else {
        this.buttonDisabled = true;
      }
    },
  },
  mounted() {
    this.tooltipInfo = this.$t("no_splitting_suggestions");
  },
  methods: {
    rotateLeft() {
      this.$emit("rotate-left", "left");
    },
    rotateRight() {
      this.$emit("rotate-right", "right");
    },
    rotateAllLeft() {
      this.$emit("rotate-all-left");
    },
    rotateAllRight() {
      this.$emit("rotate-all-right");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
