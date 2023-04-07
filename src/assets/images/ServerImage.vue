<template>
  <div style="display: flex">
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
      type: Number,
    },
    width: {
      default: null,
      type: Number,
    },
  },
  data() {
    return {
      loaded: false,
    };
  },
  watch: {
    imageUrl() {
      this.loadImage();
    },
  },
  mounted() {
    this.loadImage();
  },
  methods: {
    loadImage() {
      if (!this.imageUrl) return;
      return api.IMG_REQUEST.get(this.imageUrl)
        .then((response) => {
          return response.data;
        })
        .then((myBlob) => {
          this.$refs.imgTag.src = URL.createObjectURL(myBlob);
          if (this.height) {
            this.$refs.imgTag.style.height = this.height;
          }
          if (this.width) {
            this.$refs.imgTag.style.width = this.width;
          }
          this.loaded = true;
        });
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
