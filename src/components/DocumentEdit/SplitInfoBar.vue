<template>
  <div class="split-info-bar">
    <StarIcon />
    <span> {{ $t("smart_split_suggestions") }}</span>
  </div>
</template>

<script>
import StarIcon from "../../assets/images/StarIcon";

export default {
  name: "SplitInfoBar",
  components: {
    StarIcon,
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
