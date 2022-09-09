<template>
  <img ref="imgTag" />
</template>

<script>
import api from "../../api";
import { mapState } from "vuex";

export default {
  name: "ServerImage",
  props: {
    imageUrl: {
      required: true
    }
  },
  computed: {
    ...mapState("document", ["selectedDocument"])
  },
  methods: {
    loadImage() {
      if (this.selectedDocument.labeling_available === 1) {
        return api.IMG_REQUEST.get(this.imageUrl)
          .then(response => {
            return response.data;
          })
          .then(myBlob => {
            this.$refs.imgTag.src = URL.createObjectURL(myBlob);
          });
      }
    }
  },
  mounted() {
    this.loadImage();
  },
  watch: {
    imageUrl() {
      this.loadImage();
    },
    selectedDocument() {
      this.loadImage();
    }
  }
};
</script>
