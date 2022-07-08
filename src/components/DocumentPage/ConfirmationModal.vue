<style
  scoped
  lang="scss"
  src="../../assets/scss/confirm_rotation_modal.scss"
></style>

<template>
  <section>
    <b-modal v-model="isConfirmationModalActive" :can-cancel="['x']">
      <header class="modal-card-head">
        <div class="icon-container">
          <AlertCircle />
        </div>
        <h3 class="modal-title">
          {{ $t("confirm_rotation") }}
        </h3>
      </header>
      <section class="modal-card-body">
        <p class="modal-description">{{ $t("rotation_warning") }}</p>
      </section>
      <footer class="modal-card-foot">
        <b-button class="cancel-btn btn" @click="handleCloseModal">
          {{ $t("cancel") }}
        </b-button>

        <b-button class="confirm-btn btn" @click="handleConfirm">
          {{ $t("rotate") }}
        </b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
import AlertCircle from "../../assets/images/AlertCircle";

export default {
  name: "ConfirmationModal",
  props: {
    isConfirmationModalActive: {
      type: Boolean
    }
  },
  components: {
    AlertCircle
  },
  methods: {
    handleCloseModal() {
      this.$emit("close-modal");
    },
    handleConfirm() {
      this.$emit("handle-confirmation");
    }
  }
};
</script>
