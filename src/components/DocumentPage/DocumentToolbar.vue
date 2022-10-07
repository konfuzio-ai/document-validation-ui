<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div :class="['toolbar', recalculatingAnnotations && 'hidden']">
      <b-tooltip
        :label="tooltipInfo"
        multilined
        type="is-dark"
        :active="editModeDisabled"
        size="is-large"
      >
        <div
          :class="[
            'icons icons-left',
            editModeDisabled && 'edit-mode-disabled'
          ]"
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
import EditDocIcon from "../../assets/images/EditDocIcon";

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
      defaultScale: null,
      currentPercentage: 100,
      defaultPercentage: 0.25,
      currentPercentageDifference: 0.25, // this mutates and shows how much we will zoom in or out
      fitPercentage: 0.5,
      toolbarModalOpen: true,
      editModeDisabled: false,
      tooltipInfo: this.$t("edit_not_available")
    };
  },
  computed: {
    ...mapState("display", ["scale"]),
    ...mapState("document", ["selectedDocument", "recalculatingAnnotations"])
  },
  created() {
    window.addEventListener("resize", this.handleDefaultScale);
  },
  methods: {
    handleEdit() {
      if (this.editModeDisabled) return;
      this.$store.dispatch("edit/enableEditMode").then(() => {
        this.$store.dispatch("display/updateFit", "width");
      });
    },
    zoomIn() {
      let scale;
      let percentageChange;

      switch (true) {
        case this.currentPercentage === 0:
          this.currentPercentageDifference = this.defaultPercentage * 3;
          scale = this.defaultScale - this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference - this.defaultPercentage;
          break;
        case this.currentPercentage === 50:
          this.currentPercentageDifference = this.defaultPercentage;
          scale = this.defaultScale - this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference - this.defaultPercentage;
          break;
        case this.currentPercentage === 75:
          scale = this.defaultScale;
          percentageChange = this.defaultPercentage;
          break;
        case this.currentPercentage >= 100:
          scale = this.defaultScale + this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference + this.defaultPercentage;
          break;
        case this.currentPercentage < 100:
          scale = this.defaultScale - this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference - this.defaultPercentage;
          break;
        default:
          break;
      }

      this.updateScale(scale);

      // Update how much to zoom in/out next
      this.currentPercentageDifference = percentageChange;

      this.currentPercentage += this.defaultPercentage * 100;
    },
    zoomOut() {
      if (this.currentPercentage === 0) return;

      let scale;
      let percentageChange;

      switch (true) {
        case this.currentPercentage === 50:
          this.currentPercentageDifference += this.defaultPercentage;
          scale = this.defaultScale - this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference + this.defaultPercentage;
          break;
        case this.currentPercentage === 125:
          scale = this.defaultScale;
          percentageChange = this.defaultPercentage;
          break;
        case this.currentPercentage <= 100:
          scale = this.defaultScale - this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference + this.defaultPercentage;
          break;
        case this.currentPercentage > 100:
          scale = this.defaultScale + this.currentPercentageDifference;
          percentageChange =
            this.currentPercentageDifference - this.defaultPercentage;
          break;
        default:
          break;
      }

      this.updateScale(scale);

      // Update how much to zoom in/out next
      if (percentageChange === 0) {
        percentageChange = this.defaultPercentage;
      }

      this.currentPercentageDifference = percentageChange;

      this.currentPercentage -= this.defaultPercentage * 100;
    },
    fitAuto() {
      if (this.currentPercentage === 50 || !this.defaultScale) return;

      // Always set to 50%
      this.updateScale(this.defaultScale - this.fitPercentage);

      this.currentPercentage = this.fitPercentage * 100;
      this.currentPercentageDifference = this.fitPercentage;
    },
    updateScale(scale) {
      this.$store.dispatch("display/updateScale", { scale });
      // set the update fit to undefined so it can be fired again
      // after changing the zoom
      this.$store.dispatch("display/updateFit", "undefined");
    },
    handleDefaultScale() {
      // When resizing, the doc dimensions get recalculated to fit
      // the dashboard document
      // so reset the % and update the scale
      this.currentPercentage = 100;
      this.defaultScale = this.scale;
    }
  },
  watch: {
    selectedDocument(newValue) {
      // check if the document has a dataset status of 'Training' or 'Test'
      // and if so disable the option to edit the document
      if (
        newValue.dataset_status === 1 ||
        newValue.dataset_status === 2 ||
        newValue.dataset_status === 3
      ) {
        this.editModeDisabled = true;
      }
    }
  },
  mounted() {
    this.defaultScale = this.scale;

    if (this.selectedDocument) {
      if (
        this.selectedDocument.dataset_status === 1 ||
        this.selectedDocument.dataset_status === 2 ||
        this.selectedDocument.dataset_status === 3
      ) {
        this.editModeDisabled = true;
      }
    }
  }
};
</script>
