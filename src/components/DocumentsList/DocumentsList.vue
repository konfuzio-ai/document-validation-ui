<style scoped lang="scss" src="../../assets/scss/documents_list.scss"></style>
<template>
  <div class="documents-list" v-if="selectedCategory">
    <div class="documents-list-top" v-if="showCategoryInfo">
      <div class="documents-list-top-left">
        <h2>{{ selectedCategory.name }}</h2>
        <p>
          {{ selectedCategory.description }}
        </p>
      </div>
      <div class="documents-list-top-right">
        <div class="action-box">
          <span>{{ $t("upload_documents") }}</span>
          <b-button
            class="action-button"
            type="is-primary"
            @click="requestTrialAccess"
            >{{ $t("request_trial") }}</b-button
          >
        </div>
      </div>
    </div>
    <div class="documents-list-bottom" v-if="documentsList">
      <b-carousel-list :data="documentsList" :items-to-show="5">
        <template #item="document">
          <div
            :class="[
              'documents-list-thumbnail',
              documentId == document.id && 'selected'
            ]"
            v-on:click="changeDocument(document.id)"
          >
            <ServerImage
              :class="[
                'img-thumbnail',
                documentId == document.id && 'selected'
              ]"
              :imageUrl="document.thumbnail_url"
            />
            <div
              :class="[
                'document-name',
                documentId == document.id && 'selected'
              ]"
            >
              <!-- if is the current document, then we use the store variable to get the file name edits in real time -->
              {{
                selectedDocument.id == document.id
                  ? selectedDocument.data_file_name
                  : document.data_file_name
              }}
            </div>
            <div class="error-icon" v-if="document.status_data === 111">
              <ErrorIcon />
            </div>
          </div>
        </template>
      </b-carousel-list>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import ErrorIcon from "../../assets/images/ErrorIcon";

/**
 * This component creates a horizontal list of documents
 * with thumbnail pictures which are clickable.
 */

export default {
  name: "DocumentsList",
  components: {
    ServerImage,
    ErrorIcon
  },
  data() {
    return {
      showCategoryInfo: false,
      documentsList: null
    };
  },
  computed: {
    ...mapState("document", ["documentId", "selectedDocument", "currentUser"]),
    ...mapState("category", ["documents", "selectedCategory"]),
    ...mapGetters("category", { documentListForUser: "documentListForUser" })
  },
  methods: {
    changeDocument(documentId) {
      this.$store.dispatch("document/setDocId", documentId);
    },
    requestTrialAccess() {
      window.open("https://konfuzio.com", "_blank");
    }
  },
  watch: {
    documents(newValue) {
      if (newValue) {
        this.documentsList = this.documentListForUser(null);
      }
    }
  }
};
</script>
