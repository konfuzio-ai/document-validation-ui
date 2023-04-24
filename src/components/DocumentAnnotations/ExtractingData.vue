<template>
  <div class="data-extraction-container">
    <div class="loading-container">
      <AnnotationActionButtons
        :is-loading="true"
        :save-btn="false"
        :cancel-btn="false"
      />
    </div>
    <div class="data-extraction-text">
      <p class="title">
        {{ $t("data_being_extracted") }}
      </p>
      <div class="description">
        <p>{{ $t("analysing_document") }}</p>
        <p>{{ $t("few_minutes") }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import AnnotationActionButtons from "./AnnotationActionButtons";

export default {
  name: "ExtractingData",
  components: { AnnotationActionButtons },
};
</script>
<style scoped lang="scss" src="../../assets/scss/extracting_data.scss"></style>
