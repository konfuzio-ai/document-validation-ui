<style
  scoped
  lang="scss"
  src="../../assets/scss/document_dataset_status.scss"
></style>

<template>
  <b-dropdown class="dataset-status-chooser">
    <template #trigger>
      <div class="dataset-status-drop-down">
        <div class="icon">
          <StatusIcon />
        </div>
        <div class="dataset-status-info">
          <p class="dataset-status-title">{{ $t("status") }}</p>
          <div class="dataset-status-name">
            {{ datasetStatus === 0 ? $t("set_status") : handleStatus() }}
          </div>
        </div>
        <div class="caret">
          <b-icon icon="angle-down" size="is-small" class="caret"></b-icon>
        </div>
      </div>
    </template>

    <p class="dropdown-menu-title">{{ $t("status") }}</p>

    <b-dropdown-item
      class="dropdown-item"
      v-for="(status, index) in statusList"
      :key="index"
      aria-role="listitem"
      @click="handleChangeStatus(index)"
      :disabled="disable(status)"
      >{{ status }}</b-dropdown-item
    >
  </b-dropdown>
</template>

<script>
import StatusIcon from "../../assets/images/StatusImg";

export default {
  name: "DatasetStatus",
  data() {
    return {
      statusList: [
        this.$t("preparation"),
        this.$t("training"),
        this.$t("test"),
        this.$t("excluded")
      ],
      currentStatus: null
    };
  },
  props: {
    datasetStatus: {
      type: Number
    }
  },
  components: {
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
          if (response === 200) {
            this.currentStatus = this.statusList[index];
          } else {
            this.$store.dispatch(
              "document/setErrorMessage",
              this.$t("status_error")
            );
          }
        });
    },
    handleStatus() {
      if (!this.currentStatus) {
        return this.statusList[this.datasetStatus - 1];
      }
      return this.currentStatus;
    },
    disable(status) {
      if (this.datasetStatus === this.statusList.indexOf(status) + 1) {
        return true;
      }
    }
  }
};
</script>
