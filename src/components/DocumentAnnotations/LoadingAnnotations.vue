<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="annotations-skeleton">
    <div class="label-set-name-skeleton">
      <b-skeleton width="20%" height="8px"></b-skeleton>
    </div>

    <!-- Label rows -->
    <div v-for="n in numberOfLabelRows" :key="n">
      <LoadingLabels />
    </div>
  </div>
</template>

<script>
import LoadingLabels from "./LoadingLabels";

/**
 * This component shows a skeleton instead of the label sets
 *  while some document data is still loading
 */

export default {
  name: "LoadingAnnotations",
  components: { LoadingLabels },
  data() {
    return {
      numberOfLabelRows: 7
    };
  }
};
</script>
