<style lang="scss" src="../assets/scss/main.scss"></style>
<template>
  <div class="app-container">
    <div v-if="recalculatingAnnotations" class="overlay"></div>
    <DocumentsList />
    <DocumentDashboard />
  </div>
</template>

<script>
import DocumentDashboard from "./DocumentDashboard";
import { DocumentsList } from "./DocumentsList";
import { mapState } from "vuex";

export default {
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
    category: { type: String, required: false },
    locale: { type: String, required: false }
  },
  created() {
    this.$store.dispatch("document/setDocId", this.documentId);

    if (this.locale && this.locale !== "") {
      this.$i18n.locale = this.locale;
    }
    this.documentLoading();
  },
  computed: {
    ...mapState("document", {
      publicView: "publicView",
      selectedDocument: "selectedDocument",
      recalculatingAnnotations: "recalculatingAnnotations",
      documentIsReady: "documentIsReady",
      documentChanged: "documentId"
    }),
    documentId() {
      if (process.env.VUE_APP_DOCUMENT_ID) {
        return process.env.VUE_APP_DOCUMENT_ID;
      } else if (this.document) {
        return this.document;
      } else {
        return null;
      }
    }
  },
  watch: {
    documentChanged(newValue, oldValue) {
      // check if it's not first time (we already fetch the document on the created function)
      if (oldValue !== null && newValue !== oldValue) {
        this.documentLoading();
      }
    },
    documentIsReady(newValue) {
      if (newValue) {
        this.documentLoading();
      }
    },
    selectedDocument(newValue, oldValue) {
      if (!this.publicView) {
        if (oldValue === null && newValue) {
          // first time
          this.categoryLoading(newValue.project);
          this.documentsListLoading(newValue.category, false);
        }
        // TODO: this business validations should be done on the store
        else if (
          newValue.labeling_available == 1 &&
          newValue.status_data === 2 &&
          oldValue &&
          oldValue.category !== null
        ) {
          this.categoryLoading(newValue.project);
          this.documentsListLoading(newValue.category);
        }
      }
    }
  },
  methods: {
    documentLoading() {
      this.$store.dispatch("document/startLoading");
      Promise.all([
        this.$store.dispatch("document/fetchAnnotations"),
        this.$store.dispatch("document/fetchDocumentData"),
        !this.publicView &&
          this.$store.dispatch("document/fetchMissingAnnotations"),
        !this.publicView && this.$store.dispatch("document/fetchCurrentUser")
      ]).finally(() => {
        this.$store.dispatch("document/endLoading");
      });
    },
    categoryLoading(projectId) {
      Promise.all([
        this.$store.dispatch("category/fetchCategories", projectId)
      ]);
    },
    documentsListLoading(categoryId, poll = true) {
      if (categoryId) {
        Promise.all([
          this.$store.dispatch("category/createAvailableDocumentsList", {
            categoryId,
            poll
          })
        ]);
      }
    }
  }
};
</script>
