<style scoped lang="scss" src="../../assets/scss/extracting_data.scss"></style>
<template>
  <div class="data-extraction-container">
    <img
      src="../../assets/images/ExtractingDataGif.gif"
      alt="document-loading"
    />
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
export default {
  name: "ExtractingData"
};
</script>
