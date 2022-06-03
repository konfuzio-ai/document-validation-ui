<style
  scoped
  lang="scss"
  src="../assets/scss/document_viewport_modal.scss"
></style>

<template>
  <section>
    <b-modal v-model="isModalActive" :can-cancel="['x']">
      <div class="modal-card">
        <div class="image">
          <Illustration />
        </div>
        <div class="content">
          <h3>{{ $t("small_viewport_title") }}</h3>
          <p>{{ $t("small_viewport_info") }}</p>

          <button class="ok-btn" @click="handleNotOptimizedModal">
            {{ $t("ok") }}
          </button>
        </div>
      </div>
    </b-modal>
  </section>
</template>

<script>
import Illustration from "../assets/images/NotOptimizedIllustration.vue";

export default {
  name: "NotOptimizedViewportModal",
  data() {
    return {
      isModalActive: true
    };
  },
  components: {
    Illustration
  },
  methods: {
    handleNotOptimizedModal() {
      this.isModalActive = false;
    }
  }
};
</script>
