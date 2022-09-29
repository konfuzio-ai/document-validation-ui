<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>

<template>
  <div class="skeleton-container">
    <b-skeleton width="40px" height="57px"></b-skeleton>

    <b-skeleton width="7px" height="5px" :rounded="false"></b-skeleton>
  </div>
</template>

<script>
/**
 * This component shows a skeleton instead of the thumbnails
 *  while some document data is still loading
 */

export default {
  name: "LoadingThumbnails"
};
</script>
