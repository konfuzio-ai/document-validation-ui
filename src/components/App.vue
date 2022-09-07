<style lang="scss" src="../assets/scss/main.scss"></style>
<template>
  <div>
    <DocumentsList v-if="categoryId" />
    <DocumentDashboard class="dashboard-component" />
  </div>
</template>

<script>
import DocumentDashboard from "./DocumentDashboard";
import { DocumentsList } from "./DocumentsList";
import store from "../store";
import { mapState } from "vuex";

export default {
  store,
  name: "App",
  components: {
    DocumentsList,
    DocumentDashboard
  },
  props: {
    document: {
      type: String,
      required: false
    },
    category: { type: String, required: false }
  },
  created() {
    this.documentLoading();
    if (!this.publicView) {
      this.categoryLoading();
      this.documentsListLoading();
    }
  },
  computed: {
    ...mapState("document", ["documentId", "showRejectedLabels", "publicView"]),
    documentId() {
      return this.document ? this.document : process.env.VUE_APP_DOCUMENT_ID;
    },
    categoryId() {
      return this.category ? this.category : process.env.VUE_APP_CATEGORY_ID;
    }
  },
  watch: {
    documentId() {
      this.documentLoading();
    }
  },
  methods: {
    documentLoading() {
      this.$store.dispatch("document/startLoading");
      Promise.all([
        this.$store.dispatch("document/setDocId", this.documentId),
        this.$store.dispatch("document/fetchAnnotations"),
        this.$store.dispatch("document/fetchDocumentData"),
        this.showRejectedLabels &&
          !this.publicView &&
          this.$store.dispatch("document/fetchMissingAnnotations"),
        this.$store.dispatch("document/fetchCurrentUser")
      ]).finally(() => {
        this.$store.dispatch("document/endLoading");
      });
    },
    categoryLoading() {
      Promise.all([
        this.$store.dispatch("category/setCategoryId", this.categoryId),
        this.$store.dispatch("category/fetchCategories")
      ]);
    },
    documentsListLoading() {
      if (this.categoryId) {
        Promise.all([this.$store.dispatch("category/fetchDocumentList")]).then(
          () => {
            this.$store.dispatch("category/createAvailableDocumentsList");
          }
        );
      }
    }
  }
};
</script>
