<style scoped lang="scss" src="../../assets/scss/edit_top_bar.scss"></style>
<template>
  <div class="edit-top-bar">
    <b-dropdown>
      <template #trigger>
        <a class="navbar-item dropdown-option" role="button">
          <b-icon :icon="optionIcon" class="option-icon" />
          <span>Categories</span>
          <div class="caret">
            <CaretDown />
          </div>
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
      <b-button label="Test" type="is-default" />
      <b-button label="Test" type="is-primary" :disabled="true" />
    </div>
  </div>
</template>

<script>
import CaretDown from "../../assets/images/TopBarCaretDownImg.vue";
export default {
  name: "EditTopBar",
  components: {
    CaretDown
  },
  data() {
    return {
      optionIcon: "xmark"
    };
  },
  methods: {}
};
</script>
