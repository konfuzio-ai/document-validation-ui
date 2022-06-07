<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>

<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <div class="icons icons-left">
        <RotateIcon />
        <FitZoomIcon />
      </div>
      <div class="icons icons-right">
        <PlusIcon />
        <MinusIcon />
        <div class="percentage">{{ `${currentPercentage}%` }}</div>
      </div>
    </div>
  </div>
</template>

<script>
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
      currentPercentage: 100
    };
  }
};
</script>
