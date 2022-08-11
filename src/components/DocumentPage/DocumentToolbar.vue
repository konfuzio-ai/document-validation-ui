<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div :class="['toolbar', recalculatingAnnotations && 'hidden']">
      <div class="icons icons-left">
        <div class="edit-icon icon" @click="handleReorder">
          <ReorderDocIcon />
        </div>
        <div class="split-icon icon" @click="handleSplit">
          <SplitDocIcon />
        </div>
        <div class="rotate-icon icon" @click="handleRotate">
          <RotateIcon />
        </div>
        <div class="fit-zoom icon" @click.prevent.stop="fitAuto">
          <FitZoomIcon />
        </div>
      </div>
      <div class="icons icons-right">
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
import ReorderDocIcon from "../../assets/images/ReorderDocIcon";
import SplitDocIcon from "../../assets/images/SplitDocIcon";
import RotateIcon from "../../assets/images/RotateIcon";
import FitZoomIcon from "../../assets/images/FitZoomIcon";
import PlusIcon from "../../assets/images/PlusIcon";
import MinusIcon from "../../assets/images/MinusIcon";

export default {
  name: "Toolbar",
  components: {
    ReorderDocIcon,
    SplitDocIcon,
    RotateIcon,
    FitZoomIcon,
    PlusIcon,
    MinusIcon
  },
  data() {
    return {
      currentPercentage: 100,
      minimumPercentage: 0,
      increment: 0.25,
      toolbarModalOpen: true
    };
  },
  computed: {
    ...mapState("display", ["scale"]),
    ...mapState("document", ["recalculatingAnnotations"]),
    ...mapState("edit", ["editOptions"])
  },
  methods: {
    handleRotate() {
      this.$store
        .dispatch("edit/setEditMode", this.editOptions.rotate)
        .then(() => {
          this.$store.dispatch("display/updateFit", "auto");
        });
    },
    handleSplit() {
      this.$store
        .dispatch("edit/setEditMode", this.editOptions.split)
        .then(() => {
          this.$store.dispatch("display/updateFit", "auto");
        });
    },
    handleReorder() {
      this.$store
        .dispatch("edit/setEditMode", this.editOptions.reorder)
        .then(() => {
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
  }
};
</script>
