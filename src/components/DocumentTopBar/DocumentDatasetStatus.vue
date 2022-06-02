<style
  scoped
  lang="scss"
  src="../../assets/scss/document_dataset_status.scss"
></style>

<template>
  <b-dropdown class="dataset-status-chooser">
    <template #trigger>
      <div class="dropdown-list">
        <div class="icon">
          <StatusIcon />
        </div>
        <div class="dataset-status-dropdown">
          <p>{{ $t("status") }}</p>
          <div class="status">
            {{ datasetStatus === 0 ? $t("set_status") : handleStatus() }}
          </div>
        </div>
        <div class="caret">
          <CaretDown />
        </div>
      </div>
    </template>
    <p class="dropdown-menu-title">{{ $t("status") }}</p>
    <b-dropdown-item
      v-for="(status, index) in statusList"
      :key="index"
      aria-role="listitem"
      @click="handleChangeStatus(index)"
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
      currentStatus: null
    };
  },
  props: {
    datasetStatus: {
      type: Number
    }
  },
  components: {
    CaretDown,
    StatusIcon
  },
  methods: {
    handleChangeStatus(index) {
      const updatedDatasetStatus = {
        dataset_status: index + 1
      };

      this.$store
        .dispatch("document/updateDocument", updatedDatasetStatus)
        .then(response => {
          // Check if the response is successfull or not
          if (response) {
            this.currentStatus = this.statusList[index];
          } else {
            console.log("Something went wrong");
          }
        });
    },
    handleStatus() {
      if (!this.currentStatus) {
        return this.statusList[this.datasetStatus - 1];
      }
      return this.currentStatus;
    }
  }
};
</script>
