<template>
  <section class="viewport-modal">
    <b-modal
      v-model="isModalActive"
      class="modal-text-center"
      :width="500"
      :can-cancel="false"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>{{ $t("annotation_deleted") }}</h3>
        </div>
      </section>
      <footer class="modal-card-foot" style="padding-top: 0">
        <b-button type="is-primary" class="primary-button" @click="closeModal">
          {{ $t("ok") }}
        </b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
export default {
  name: "AnnotationDeletedModal",
  data() {
    return {
      isModalActive: window.location.hash === "#deleted",
    };
  },
  methods: {
    closeModal() {
      window.location.hash = "";
      this.isModalActive = false;
    },
  },
};
</script>
