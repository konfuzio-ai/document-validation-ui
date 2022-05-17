<template>
  <img ref="imgTag" />
</template>

<script>
import api from "../api";

export default {
  name: "ServerImage",
  props: {
    imageUrl: {
      required: true
    }
  },
  mounted() {
    const config = { responseType: "blob" };
    let url = this.imageUrl;
    if (process.env.VUE_APP_DOCUMENT_IMAGES_URL) {
      url = `${process.env.VUE_APP_DOCUMENT_IMAGES_URL}${url}`;
    }

    return api.HTTP.get(url, config)
      .then(response => {
        return response.data;
      })
      .then(myBlob => {
        this.$refs.imgTag.src = URL.createObjectURL(myBlob);
      });
  }
};
</script>
