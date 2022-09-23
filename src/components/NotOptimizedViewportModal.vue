<style
  scoped
  lang="scss"
  src="../assets/scss/document_viewport_modal.scss"
></style>

<template>
  <section class="viewport-modal">
    <b-modal :width="500" v-model="isModalActive" :can-cancel="['x']">
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
        <b-button type="is-primary" @click="handleNotOptimizedModal">
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
