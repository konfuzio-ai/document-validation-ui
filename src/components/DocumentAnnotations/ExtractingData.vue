<style scoped lang="scss" src="../../assets/scss/extracting_data.scss"></style>
<template>
  <div class="data-extraction-container">
    <div class="loading-container">
      <ActionButtons
        :isLoading="true"
        :saveBtn="false"
        :cancelBtn="false"
        :menu="false"
      />
    </div>
    <div class="data-extraction-text">
      <p class="title">{{ $t("data_being_extracted") }}</p>
      <div class="description">
        <p>{{ $t("analysing_document") }}</p>
        <p>{{ $t("few_minutes") }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import ActionButtons from "./ActionButtons";

export default {
  name: "ExtractingData",
  components: { ActionButtons }
};
</script>
