<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="edit-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">{{ $t("edit_document") }}</h3>
      <p class="description">{{ $t("select_pages") }}</p>
    </div>

    <div class="buttons-container">
      <div class="rotate-selected rotate">
        <p :class="['pages-selected', buttonDisabled && 'disabled']">
          {{ selectedPages.length }} {{ $t("selected") }}
        </p>
        <b-button
          class="rotate-button"
          @click="rotateLeft"
          :disabled="buttonDisabled"
        >
          <b-icon icon="arrow-rotate-left" class="is-small" />
          <span class="btn-text">{{ $t("rotate_selected") }}</span>
        </b-button>
        <b-button
          class="rotate-button"
          @click="rotateRight"
          :disabled="buttonDisabled"
        >
          <div class="button-content">
            <b-icon icon="arrow-rotate-right" class="is-small" />
            <span class="btn-text">{{ $t("rotate_selected") }}</span>
          </div>
        </b-button>
      </div>

      <div class="rotate-all rotate">
        <b-button class="rotate-button" @click="rotateAllLeft">
          <b-icon icon="arrow-rotate-left" class="is-small" />
          <span class="btn-text">{{ $t("rotate_all") }}</span>
        </b-button>
        <b-button class="rotate-button" @click="rotateAllRight">
          <b-icon icon="arrow-rotate-right" class="is-small" />
          <span class="btn-text">{{ $t("rotate_all") }}</span>
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * This component renders buttons to rotate single pages or all pages
 * in edit mode
 * */

import { mapState } from "vuex";

export default {
  name: "EditSidebar",
  data() {
    return {
      buttonDisabled: true
    };
  },
  computed: {
    ...mapState("edit", ["selectedPages"])
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
    }
  },
  watch: {
    selectedPages(newValue) {
      if (newValue.length > 0) {
        this.buttonDisabled = false;
      } else {
        this.buttonDisabled = true;
      }
    }
  }
};
</script>
