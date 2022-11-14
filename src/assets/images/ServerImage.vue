<template>
  <div style="display: flex">
    <img :height="height" ref="imgTag" v-show="loaded" />
    <slot v-if="!loaded"></slot>
  </div>
</template>

<script>
import api from "../../api";

export default {
  name: "ServerImage",
  props: {
    imageUrl: {
      required: true
    },
    height: {
      default: null
    },
    width: {
      default: null
    }
  },
  data() {
    return {
      loaded: false
    };
  },
  methods: {
    loadImage() {
      if (!this.imageUrl) return;
      return api.IMG_REQUEST.get(this.imageUrl)
        .then(response => {
          return response.data;
        })
        .then(myBlob => {
          this.$refs.imgTag.src = URL.createObjectURL(myBlob);
          if (this.height) {
            this.$refs.imgTag.style.height = this.height;
          }
          if (this.width) {
            this.$refs.imgTag.style.width = this.width;
          }
          this.loaded = true;
        });
    }
  },
  mounted() {
    this.loadImage();
  },
  watch: {
    imageUrl() {
      this.loadImage();
    }
  }
};
</script>
