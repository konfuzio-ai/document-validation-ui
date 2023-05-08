<template>
  <div v-observe-visibility="visibilityChanged" style="display: flex">
    <img v-show="loaded" ref="imgTag" :height="height" />
    <slot v-if="!loaded" />
  </div>
</template>

<script>
import api from "../../api";

export default {
  name: "ServerImage",
  props: {
    imageUrl: {
      required: true,
      type: String,
    },
    height: {
      default: null,
      type: String,
    },
    width: {
      default: null,
      type: String,
    },
  },
  data() {
    return {
      loaded: false,
      isVisible: false,
    };
  },
  watch: {
    imageUrl() {
      if (this.isVisible) {
        this.loadImage();
      }
    },
  },
  methods: {
    loadImage() {
      if (!this.imageUrl) return;
      return api
        .makeImageRequest(this.imageUrl)
        .then((myBlob) => {
          this.$refs.imgTag.src = URL.createObjectURL(myBlob);
          if (this.height) {
            this.$refs.imgTag.style.height = this.height;
          }
          if (this.width) {
            this.$refs.imgTag.style.width = this.width;
          }
          this.loaded = true;
        })
        .catch((error) => {
          this.loaded = false;
        });
    },
    visibilityChanged(isVisible) {
      if (!this.isVisible && isVisible) {
        this.isVisible = isVisible;
        this.loadImage();
      }
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
