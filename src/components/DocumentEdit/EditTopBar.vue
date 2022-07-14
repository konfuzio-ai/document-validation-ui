<style scoped lang="scss" src="../../assets/scss/edit_top_bar.scss"></style>
<template>
  <div class="edit-top-bar">
    <b-dropdown
      append-to-body
      aria-role="menu"
      scrollable
      max-height="200"
      trap-focus
    >
      <template #trigger>
        <a class="navbar-item" role="button">
          <span>Categories</span>
          <b-icon icon="menu-down"></b-icon>
        </a>
      </template>
      <b-dropdown-item
        v-for="item of filteredData"
        :key="item"
        aria-role="listitem"
        >{{ item }}</b-dropdown-item
      >
    </b-dropdown>
    <div class="buttons">
      <b-button label="Test" type="is-primary" />
    </div>
  </div>
</template>

<script>
export default {
  name: "EditTopBar",
  methods: {}
};
</script>
