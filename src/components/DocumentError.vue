<template>
  <section class="document-error-modal">
    <b-modal v-model="isModalActive" :width="400">
      <section class="modal-card-body">
        <div class="header">
          <div class="error-icon">
            <ErrorIcon class="icon" />
          </div>
          <div class="btn-container" type="button" @click="closeModal">
            <b-icon icon="xmark" class="close-btn" size="is-small" />
          </div>
        </div>
        <div class="content">
          <h3>{{ $t("document_error_title") }}</h3>
          <p>{{ $t("document_error_info") }}</p>
        </div>
      </section>
      <footer class="modal-card-foot">
        <b-button type="is-primary" @click="handleContactSupport">
          {{ $t("contact_support") }}
        </b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
import { mapState } from "vuex";
import ErrorIcon from "../assets/images/ErrorIcon";

export default {
  name: "DocumentError",
  components: {
    ErrorIcon,
  },
  data() {
    return {
      isModalActive: true,
    };
  },
  methods: {
    handleContactSupport() {
      const documentError = "Document error";
      this.$store.dispatch("document/contactSupport", documentError);
    },
    closeModal() {
      this.$store.dispatch("document/setDocumentError", false);
    },
  },
};
</script>

<style scoped lang="scss" src="../assets/scss/document_error.scss"></style>
