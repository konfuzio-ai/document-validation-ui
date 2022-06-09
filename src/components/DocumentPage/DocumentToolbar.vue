<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <div class="icons icons-left">
        <div class="rotate icon">
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
import RotateIcon from "../../assets/images/RotateIcon.vue";
import FitZoomIcon from "../../assets/images/FitZoomIcon.vue";
import PlusIcon from "../../assets/images/PlusIcon.vue";
import MinusIcon from "../../assets/images/MinusIcon.vue";

export default {
  name: "Toolbar",
  components: {
    RotateIcon,
    FitZoomIcon,
    PlusIcon,
    MinusIcon
  },
  data() {
    return {
      currentPercentage: 100,
      increment: 0.25
    };
  },
  computed: {
    ...mapState("display", ["scale"])
  },
  methods: {
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
      if (this.currentPercentage === 100) {
        return;
      }
      this.$store.dispatch("display/updateFit", "auto");
      this.currentPercentage = 90;
    }
  }
};
</script>
