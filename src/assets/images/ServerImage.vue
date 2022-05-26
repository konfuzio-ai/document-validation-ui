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
  mounted() {
    return api.IMG_REQUEST.get(this.imageUrl)
      .then(response => {
        return response.data;
      })
      .then(myBlob => {
        this.$refs.imgTag.src = URL.createObjectURL(myBlob);
      });
  }
};
</script>
