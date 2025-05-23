<template>
  <div
    v-if="documentsAvailableToReview && documentsAvailableToReview.length > 0"
    class="documents-list"
  >
    <div v-if="showCategoryInfo && selectedCategory" class="documents-list-top">
      <div class="documents-list-top-left">
        <h2>{{ selectedCategory.name }}</h2>
        <p>
          {{ selectedCategory.description }}
        </p>
      </div>
      <div class="documents-list-top-right">
        <div v-if="showBranding" class="action-box">
          <span>{{ $t("upload_documents") }}</span>
          <b-button
            class="action-button primary-button"
            type="is-primary"
            @click="requestTrialAccess"
          >
            {{ $t("request_trial") }}
          </b-button>
        </div>
      </div>
    </div>
    <div class="documents-list-bottom">
      <b-carousel-list :data="documentsAvailableToReview" :items-to-show="5">
        <template #item="document">
          <div
            :class="[
              'documents-list-thumbnail',
              selectedDocument.id == document.id && 'selected',
            ]"
            @click="changeDocument(document.id)"
          >
            <ServerImage
              :class="[
                'img-thumbnail',
                selectedDocument.id == document.id && 'selected',
              ]"
              :image-url="`${document.thumbnail_url}?${document.updated_at}`"
            >
              <b-skeleton width="20px" height="100%" />
            </ServerImage>
            <div
              :class="[
                'document-name',
                selectedDocument.id == document.id && 'selected',
              ]"
            >
              <!-- if is the current document, then we use the store variable to get the file name edits in real time -->
              {{
                selectedDocument.id == document.id
                  ? selectedDocument.data_file_name
                  : document.data_file_name
              }}
            </div>
            <div
              v-if="documentHadErrorDuringExtraction(document)"
              class="error-icon"
            >
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
import {
  getURLQueryParam,
  navigateToNewDocumentURL,
  getURLPath,
} from "../../utils/utils";

/**
 * This component creates a horizontal list of documents
 * with thumbnail pictures which are clickable.
 */

export default {
  name: "DocumentsList",
  components: {
    ServerImage,
    ErrorIcon,
  },
  data() {
    return {
      showCategoryInfo: false,
      selectedCategory: null,
      documentsList: null,
    };
  },
  computed: {
    ...mapState("document", ["selectedDocument"]),
    ...mapState("category", ["documentsAvailableToReview"]),
    ...mapState("display", ["showBranding"]),
    ...mapGetters("category", ["category"]),
    ...mapGetters("document", ["documentHadErrorDuringExtraction"]),
  },
  watch: {
    showCategoryInfo(newValue) {
      if (newValue) {
        this.selectedCategory = this.category(this.selectedDocument.category);
      }
    },
  },
  methods: {
    changeDocument(documentId) {
      this.$store.dispatch("document/changeCurrentDocument", documentId);
    },
    requestTrialAccess() {
      window.open("https://konfuzio.com", "_blank");
    },
  },
};
</script>
<style scoped lang="scss" src="../../assets/scss/documents_list.scss"></style>
