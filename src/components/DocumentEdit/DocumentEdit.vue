<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
<template>
  <div class="document-edit"><EditTopBar /></div>
</template>

<script>
import { mapState } from "vuex";
import EditTopBar from "./EditTopBar";
/**
 * This component shows a document thumbnail grid view to be able to edit the document.
 */
export default {
  name: "DocumentEdit",
  components: {
    EditTopBar
  },
  computed: {
    ...mapState("document", [])
  },
  methods: {}
};
</script>
