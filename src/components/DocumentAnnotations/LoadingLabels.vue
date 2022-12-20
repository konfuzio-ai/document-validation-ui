<template>
  <div class="label-properties-skeleton">
    <div class="loading-left">
      <div class="circle">
        <b-skeleton
          circle
          width="16px"
          height="16px"
        />
      </div>
      <div class="label-skeleton">
        <b-skeleton
          width="70%"
          height="8px"
        />
      </div>
    </div>

    <div class="loading-right">
      <b-skeleton
        width="80%"
        height="8px"
      />
    </div>
  </div>
</template>

<script>
/**
 * This component shows a skeleton instead of the labels and annotations
 *  while some document data is still loading
 */

export default {
  name: "LoadingLabels"
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
