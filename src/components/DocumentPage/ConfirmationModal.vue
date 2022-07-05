<style scoped></style>

<template>
  <section>
    <b-modal v-model="isModalActive" :can-cancel="['x']">
      <header class="modal-card-head">
        <div class="icon-container">
          <b-icon icon="circleExclamation" class="icon" />
        </div>
      </header>
      <section class="modal-card-body">
        <h3 class="modal-title">
          {{ $t("confirm_rotation") }}
        </h3>
        <p class="modal-description">{{ $t("rotation_warning") }}</p>
      </section>
      <footer class="modal-card-foot">
        <button class="cancel-btn btn" @click="closeModal">
          {{ $t("cancel") }}
        </button>

        <button class="confirm-btn btn" @click="handleConfirm">
          {{ $t("rotate") }}
        </button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
export default {
  name: "ConfirmationModal"
};
</script>
