<template>
  <section class="viewport-modal">
    <b-modal
      v-model="isModalActive"
      class="modal-text-center"
      :width="500"
    >
      <section class="modal-card-body">
        <div class="image">
          <Illustration />
        </div>
        <div class="content">
          <h3>{{ $t("small_viewport_title") }}</h3>
          <p>{{ $t("small_viewport_info") }}</p>
        </div>
      </section>
      <footer class="modal-card-foot">
        <b-button
          type="is-primary"
          @click="handleNotOptimizedModal"
        >
          {{ $t("ok") }}
        </b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
import Illustration from "../assets/images/NotOptimizedIllustration";

export default {
  name: "NotOptimizedViewportModal",
  components: {
    Illustration
  },
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

<style
  scoped
  lang="scss"
  src="../assets/scss/document_viewport_modal.scss"
></style>
