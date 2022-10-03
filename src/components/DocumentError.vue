<style scoped lang="scss" src="../assets/scss/document_error.scss"></style>

<template>
  <section class="document-error-modal">
    <b-modal :width="400" v-model="isModalActive" :can-cancel="['x']">
      <section class="modal-card-body">
        <div class="header">
          <div class="error-icon">
            <ErrorIcon class="icon" />
          </div>
          <div @click="closeModal" class="btn-container">
            <b-icon icon="xmark" class="close-btn" />
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
import ErrorIcon from "../assets/images/ErrorIcon";

export default {
  name: "DocumentError",
  data() {
    return {
      isModalActive: true
    };
  },
  components: {
    ErrorIcon
  },
  methods: {
    handleContactSupport() {
      let url;

      if (process.env.VUE_APP_I18N_LOCALE == "de") {
        url = "https://konfuzio.com/de/support/";
      } else {
        url = "https://konfuzio.com/en/support/";
      }

      window.location.href = url;
    },
    closeModal() {
      this.$store.dispatch("document/setDocumentError", false);
    }
  }
};
</script>
