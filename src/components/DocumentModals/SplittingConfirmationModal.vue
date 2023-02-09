<template>
  <section ref="confirmationModal" class="splitting-confirmation-modal">
    <b-modal
      v-model="isModalActive"
      class="modal-400"
      :width="500"
      :can-cancel="[]"
    >
      <section class="modal-card-body split-modal">
        <div class="header">
          <StarIcon />
          <p class="modal-title">{{ $t("split_modal_title") }}</p>
        </div>
        <div ref="bodyText" class="content"></div>
      </section>
      <footer class="modal-card-foot">
        <b-button @click="closeModal">
          {{ $t("do_it_later") }}
        </b-button>
        <b-button type="is-primary" @click="handleReviewNow">
          {{ $t("review_now") }}
          <span class="recommended">{{ recommended }}</span>
        </b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
import { mapState } from "vuex";
import StarIcon from "../../assets/images/StarIcon";

/**
 * This component shows a modal to inform the user about auto-splitting suggestions
 */
export default {
  name: "SplittingConfirmationModal",
  components: {
    StarIcon,
  },
  data() {
    return {
      isModalActive: false,
      numberOfSplitDocuments: 5,
      recommended: null,
    };
  },
  computed: {
    ...mapState("document", ["splittingSuggestions"]),
  },
  watch: {
    splittingSuggestions(newValue) {
      if (newValue) {
        this.isModalActive = true;
      }
    },
    isModalActive(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          this.$refs.bodyText.innerHTML = this.$t("split_modal_body", {
            number_of_split_documents: this.numberOfSplitDocuments,
          });
        });
      }
    },
  },
  mounted() {
    this.recommended = this.$t("recommended").toUpperCase();
  },
  methods: {
    closeModal() {
      this.$store.dispatch("document/setCategorizeModalIsActive", true);
      this.isModalActive = false;
    },
    handleReviewNow() {
      this.$store.dispatch("edit/enableEditMode");
      this.isModalActive = false;
    },
    setText(text) {
      console.log(text);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/splitting_confirmation_modal.scss"
></style>
