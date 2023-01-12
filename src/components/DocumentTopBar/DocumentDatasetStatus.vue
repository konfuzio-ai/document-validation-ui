<template>
  <b-dropdown class="dataset-status-chooser">
    <template #trigger>
      <div class="dataset-status-drop-down">
        <div class="icon">
          <StatusIcon />
        </div>
        <div class="dataset-status-info">
          <p class="dataset-status-title">
            {{ $t("status") }}
          </p>
          <div class="dataset-status-name">
            {{ datasetStatus === 0 ? $t("set_status") : handleStatus() }}
          </div>
        </div>
        <div class="caret">
          <b-icon icon="angle-down" size="is-small" class="caret" />
        </div>
      </div>
    </template>

    <p class="dropdown-menu-title">
      {{ $t("status") }}
    </p>

    <b-dropdown-item
      v-for="(status, index) in statusList"
      :key="index"
      class="dropdown-item"
      aria-role="listitem"
      :disabled="disable(status)"
      @click="handleChangeStatus(index)"
    >
      {{ status }}
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import StatusIcon from "../../assets/images/StatusImg";

export default {
  name: "DatasetStatus",
  components: {
    StatusIcon,
  },
  props: {
    datasetStatus: {
      type: Number,
    },
  },
  data() {
    return {
      statusList: [
        this.$t("preparation"),
        this.$t("training"),
        this.$t("test"),
        this.$t("excluded"),
      ],
      currentStatus: null,
    };
  },
  methods: {
    handleChangeStatus(index) {
      const updatedDatasetStatus = {
        dataset_status: index + 1,
      };

      this.$store
        .dispatch("document/updateDocument", updatedDatasetStatus)
        .then((response) => {
          // Check if the response is successfull or not
          if (response === 200) {
            this.currentStatus = this.statusList[index];
          } else {
            this.$store.dispatch("document/createErrorMessage", response, null);
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
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_dataset_status.scss"
></style>
