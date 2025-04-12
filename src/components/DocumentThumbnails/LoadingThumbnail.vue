<template>
  <div class="loading-thumbnail">
    <b-skeleton width="40px" height="57px" />
  </div>
</template>

<script>
/**
 * This component shows a skeleton instead of the thumbnails
 *  while some document data is still loading
 */

export default {
  name: "LoadingThumbnail",
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
