<style scoped lang="scss" src="../../assets/scss/dataset_status.scss"></style>

<template>
  <b-dropdown class="dataset-status-component">
    <template #trigger class="dropdown-container">
      <div class="dropdown-list">
        <div class="icon">
          <StatusIcon />
        </div>
        <div class="dataset-status-dropdown">
          <p>Status</p>
          <div class="status">
            {{ statusSelected ? statusSelected : "Set a status" }}
          </div>
        </div>
        <div class="caret">
          <CaretDown />
        </div>
      </div>
    </template>
    <p class="dropdown-menu-title">Status</p>
    <b-dropdown-item
      v-for="(status, index) in statusList"
      :key="index"
      aria-role="listitem"
      @click="handleSelection(index)"
      >{{ status }}</b-dropdown-item
    >
  </b-dropdown>
</template>

<script>
import CaretDown from "../../assets/images/TopBarCaretDownImg.vue";
import StatusIcon from "../../assets/images/StatusImg.vue";

export default {
  name: "DatasetStatus",
  data() {
    return {
      statusList: ["Preparation", "Training", "Test", "Excluded"],
      statusSelected: null
    };
  },
  components: {
    CaretDown,
    StatusIcon
  },
  methods: {
    handleSelection(index) {
      console.log(index + 1);
      this.statusSelected = this.statusList[index];
    }
  }
};
</script>
