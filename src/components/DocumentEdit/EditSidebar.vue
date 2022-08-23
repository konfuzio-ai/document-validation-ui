<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>

<template>
  <div class="edit-sidebar">
    <div class="sidebar-header">
      <h3>{{ $t("edit_document") }}</h3>
      <p class="description">{{ $t("select_pages") }}</p>
    </div>

    <div class="buttons-container">
      <div class="rotate-selected rotate">
        <p class="page-selection">
          {{ selectedPages.length }} {{ $t("selected") }}
        </p>
        <b-button
          class="rotate-button"
          icon-left="arrow-rotate-left"
          @click="rotateLeft"
        >
          <span class="btn-text">{{ $t("rotate_selected") }}</span>
        </b-button>
        <b-button class="rotate-button" icon-left="arrow-rotate-right">
          <span class="btn-text">{{ $t("rotate_selected") }}</span>
        </b-button>
      </div>

      <div class="rotate-all rotate">
        <b-button
          class="rotate-button"
          icon-left="arrow-rotate-left"
          @click="rotateAllLeft"
        >
          <span class="btn-text">{{ $t("rotate_all") }}</span>
        </b-button>
        <b-button
          class="rotate-button"
          icon-left="arrow-rotate-right"
          @click="rotateAllRight"
        >
          <span class="btn-text">{{ $t("rotate_all") }}</span>
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "EditSidebar",
  computed: {
    ...mapState("edit", ["selectedPages"])
  },
  methods: {
    rotateLeft() {
      this.$emit("rotate-left");
    },
    rotateAllLeft() {
      this.$emit("rotate-all-left");
    },
    rotateAllRight() {
      this.$emit("rotate-all-right");
    }
  },
  updated() {
    console.log(this.selectedPages);
  }
};
</script>
