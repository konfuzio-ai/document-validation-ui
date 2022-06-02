<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>

<template>
  <div class="document-top-bar" v-if="selectedDocument">
    <div class="left-bar-components">
      <DocumentCategory :selectedDocument="selectedDocument" />
      <DocumentDatasetStatus :datasetStatus="selectedDocument.dataset_status" />
    </div>

    <div class="document-name-container">
      <DocumentName :dataFileName="selectedDocument.data_file_name" />
    </div>
    <div class="handover"><DocumentHandover /></div>
  </div>
</template>

<script>
import DocumentDatasetStatus from "./DocumentDatasetStatus.vue";
import DocumentCategory from "./DocumentCategory.vue";
import DocumentName from "./DocumentName.vue";
import DocumentHandover from "./DocumentHandover.vue";
import { mapState } from "vuex";

export default {
  name: "DocumentTopBar",
  components: {
    DocumentCategory,
    DocumentDatasetStatus,
    DocumentName,
    DocumentHandover
  },
  computed: {
    ...mapState("document", ["selectedDocument"])
  }
};
</script>
