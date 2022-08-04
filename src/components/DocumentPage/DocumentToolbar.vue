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
      increment: 0.25,
      toolbarModalOpen: true
    };
  },
  computed: {
    ...mapState("display", ["scale"]),
    ...mapState("document", ["editOptions", "recalculatingAnnotations"])
  },
  methods: {
    handleRotate() {
      this.$store
        .dispatch("document/setEditMode", this.editOptions.rotate)
        .then(() => {
          this.$store.dispatch("display/updateFit", "auto");
        });
    },
    handleSplit() {
      this.$store
        .dispatch("document/setEditMode", this.editOptions.split)
        .then(() => {
          this.$store.dispatch("display/updateFit", "auto");
        });
    },
    handleReorder() {
      this.$store
        .dispatch("document/setEditMode", this.editOptions.reorder)
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
      this.updateScale(this.scale - this.increment);
      this.currentPercentage -= this.increment * 100;
    },
    updateScale(scale) {
      this.$store.dispatch("display/updateScale", { scale });
      this.$store.dispatch("display/updateFit", "undefined");
    },
    fitAuto() {
      this.$store.dispatch("display/updateFit", "auto");
      this.currentPercentage = 30;
    },
    handleShowError() {
      this.$parent.$emit("handle-error", true);
    },
    handleMessage(message) {
      this.$parent.$emit("handle-message", message);
    }
  }
};
</script>
