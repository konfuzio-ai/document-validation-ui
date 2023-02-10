<template>
  <section class="edit-confirmation-modal">
    <b-modal v-model="isModalActive" :can-cancel="[]" class="edit-modal">
      <section class="modal-card-body">
        <div class="header">
          <p class="modal-title">{{ $t("confirm_splitting") }}</p>
        </div>
        <div class="content">{{ $t("splitting_warning") }}</div>
      </section>
      <footer class="modal-card-foot">
        <b-button @click="closeModal">
          {{ $t("no") }}
        </b-button>
        <b-button type="is-primary" @click="confirmChanges">
          {{ $t("yes") }}
        </b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
import { mapState } from "vuex";
/**
 * This component shows a modal to confirm the edit changes in the document
 */
export default {
  name: "EditConfirmationModal",
  data() {
    return {
      isModalActive: false,
    };
  },
  computed: {
    ...mapState("edit", ["showEditConfirmationModal"]),
  },
  watch: {
    showEditConfirmationModal(newValue) {
      this.isModalActive = newValue;
    },
  },
  methods: {
    closeModal() {
      this.isModalActive = false;
      this.$store.dispatch("edit/setShowEditConfirmationModal", false);
    },
    confirmChanges() {
      this.$emit("save-changes");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
