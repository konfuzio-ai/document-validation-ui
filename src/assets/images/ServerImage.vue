<template>
  <img ref="imgTag" />
</template>

<script>
import api from "../../api";

export default {
  name: "ServerImage",
  props: {
    imageUrl: {
      required: true
    }
  },
  methods: {
    loadImage() {
      return api.IMG_REQUEST.get(this.imageUrl)
        .then(response => {
          return response.data;
        })
        .then(myBlob => {
          this.$refs.imgTag.src = URL.createObjectURL(myBlob);
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
