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
        <span v-if="redirectingUser"> {{ $t("wait_title") }}</span>
        <span v-else>
          {{ $t("data_being_extracted") }}
        </span>
      </p>
      <div class="description">
        <span v-if="redirectingUser">
          <p>{{ $t("redirecting_to_documents_list") }}</p>
        </span>
        <span v-else>
          <p>{{ $t("analysing_document") }}</p>
          <p>{{ $t("few_minutes") }}</p>
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import AnnotationActionButtons from "./AnnotationActionButtons";

export default {
  name: "ExtractingData",
  components: { AnnotationActionButtons },
  computed: {
    ...mapState("edit", ["redirectingUser"]),
  },
};
</script>
<style scoped lang="scss" src="../../assets/scss/extracting_data.scss"></style>
