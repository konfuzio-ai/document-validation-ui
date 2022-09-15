<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <div class="icons icons-left">
        <div class="rotate icon" @click="handleModal" v-if="!publicView">
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
    <!-- <div class="rotate-pages" v-if="toolbarModalOpen">
      <RotatePagesModal
        @close-modal="handleModal"
        :isModalActive="isModalActive"
        :setRotations="setRotations"
        :handleError="handleError"
        :handleMessage="handleMessage"
      />
    </div> -->
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
      minimumPercentage: 0,
      increment: 0.25,
      toolbarModalOpen: true,
      isModalActive: false,
      setRotations: false
    };
  },
  computed: {
    ...mapState("display", ["scale"]),
    ...mapState("document", ["publicView"])
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
