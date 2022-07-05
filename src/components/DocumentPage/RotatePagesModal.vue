<style
  scoped
  lang="scss"
  src="../assets/scss/document_viewport_modal.scss"
></style>

<template>
  <section>
    <b-modal v-model="isModalActive" :can-cancel="['x']">
      <div class="modal-card">
        <div class="header">
          <h3 class="title">
            {{ $t("rotate_pages") }}
          </h3>
        </div>
        <div class="pages-container">
          <div class="single-page"></div>
          <div class="single-page"></div>
          <div class="single-page"></div>
          <div class="single-page"></div>
        </div>
        <div class="footer">
          <footer-left>
            <div>{{ $t("rotate_all") }}</div>
            <div class="rotate-icons">
              <div class="icon"></div>
              <div class="icon"></div>
            </div>
          </footer-left>
          <footer-right>
            <button class="cancel-btn">{{ $t("cancel") }}</button>
            <button class="apply-btn">{{ $t("apply") }}</button>
          </footer-right>
        </div>
      </div>
    </b-modal>
  </section>
</template>

<script>
export default {
  name: "RotatePagesModal",
  data() {
    return {
      isModalActive: true
    };
  },
  methods: {
    handleNotOptimizedModal() {
      this.isModalActive = false;
    }
  }
};
</script>
