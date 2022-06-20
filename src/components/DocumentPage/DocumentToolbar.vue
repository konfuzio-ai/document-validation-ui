<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <div class="icons icons-left">
        <div class="rotate icon" @click="handleModal">
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
    <div class="rotate-pages" v-if="toolbarModalOpen">
      <RotatePagesModal
        @close-modal="handleModal"
        :isModalActive="isModalActive"
        :setRotations="setRotations"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import RotateIcon from "../../assets/images/RotateIcon";
import FitZoomIcon from "../../assets/images/FitZoomIcon";
import PlusIcon from "../../assets/images/PlusIcon";
import MinusIcon from "../../assets/images/MinusIcon";
import RotatePagesModal from "./RotatePagesModal";

export default {
  name: "Toolbar",
  components: {
    RotateIcon,
    FitZoomIcon,
    PlusIcon,
    MinusIcon,
    RotatePagesModal
  },
  data() {
    return {
      currentPercentage: 100,
      increment: 0.25,
      toolbarModalOpen: true,
      isModalActive: false,
      setRotations: false
    };
  },
  computed: {
    ...mapState("display", ["scale"])
  },
  methods: {
    handleModal() {
      this.isModalActive = !this.isModalActive;
      this.setRotations = !this.setRotations;
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
    }
  }
};
</script>
