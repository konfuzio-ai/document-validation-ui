<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div :class="['toolbar', recalculatingAnnotations && 'hidden']">
      <b-tooltip
        :label="tooltipInfo"
        multilined
        type="is-dark"
        :active="editModeDisabled"
      >
        <div
          :class="['icons icons-left', editModeDisabled && 'disabled']"
          @click="handleEdit"
        >
          <div class="edit-icon icon">
            <EditDocIcon />
          </div>
          <span class="edit-text">{{ $t("edit") }}</span>
        </div>
      </b-tooltip>
      <div class="toolbar-divider"></div>
      <div class="icons icons-right">
        <div class="fit-zoom icon" @click.prevent.stop="fitAuto">
          <FitZoomIcon />
        </div>
        <div class="zoom-in icon" @click.prevent.stop="zoomIn">
          <PlusIcon />
        </div>
        <div class="zoom-out icon" @click.prevent.stop="zoomOut">
          <MinusIcon />
        </div>
        <div class="percentage">{{ `${currentPercentage}%` }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import FitZoomIcon from "../../assets/images/FitZoomIcon";
import PlusIcon from "../../assets/images/PlusIcon";
import MinusIcon from "../../assets/images/MinusIcon";
import EditDocIcon from "../../assets/images/EditDocIcon.vue";

export default {
  name: "Toolbar",
  components: {
    FitZoomIcon,
    PlusIcon,
    MinusIcon,
    EditDocIcon
  },
  data() {
    return {
      currentPercentage: 100,
      minimumPercentage: 0,
      increment: 0.25,
      toolbarModalOpen: true,
      editModeDisabled: false,
      tooltipInfo: this.$t("edit_not_available")
    };
  },
  computed: {
    ...mapState("display", ["scale"]),
    ...mapState("document", ["selectedDocument", "recalculatingAnnotations"])
  },
  methods: {
    handleEdit() {
      if (this.editModeDisabled) return;
      this.$store.dispatch("edit/setEditMode", true).then(() => {
        this.$store.dispatch("display/updateFit", "auto");
      });
    },
    zoomIn() {
      this.updateScale(this.scale + this.increment);
      this.currentPercentage += this.increment * 100;
    },
    zoomOut() {
      if (this.scale <= this.increment) return;
      if (this.currentPercentage === 0) return;

      this.updateScale(this.scale - this.increment);

      // Check if the difference between the current %
      // and the increment is negative
      if (
        this.currentPercentage - this.increment * 100 <
        this.minimumPercentage
      ) {
        // We want to lower the zoom only one more time
        // when reaching this lowest value
        // and set the current % to 0
        this.currentPercentage = this.minimumPercentage;
        return;
      }

      this.currentPercentage -= this.increment * 100;
    },
    updateScale(scale) {
      this.$store.dispatch("display/updateScale", { scale });
      // set the update fit to undefined so it can be fired again
      // after changing the zoom
      this.$store.dispatch("display/updateFit", "undefined");
    },
    fitAuto() {
      this.$store.dispatch("display/updateFit", "auto");
      this.currentPercentage = 60;
    },
    handleError() {
      this.$parent.$emit("handle-error", true);
    },
    handleMessage(message) {
      this.$parent.$emit("handle-message", message);
    }
  },
  watch: {
    selectedDocument(newValue) {
      // check if the document has a dataset status of 'Training' or 'Test'
      // and if so disable the option to edit the document
      if (newValue.dataset_status === 2 || newValue.dataset_status === 3) {
        this.editModeDisabled = true;
      }
    }
  }
};
</script>
