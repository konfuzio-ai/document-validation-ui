<template>
  <section ref="splittingModal" class="splitting-confirmation-modal">
    <b-modal
      v-model="isModalActive"
      class="modal-400"
      :width="500"
      :can-cancel="[]"
    >
      <section class="modal-card-body split-modal">
        <div class="header">
          <StarIcon />
          <p class="modal-title">
            {{
              splittingSuggestions && splittingSuggestions.length > 0
                ? $t("split_modal_title")
                : $t("prepare_document")
            }}
          </p>
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
import { nextTick } from "vue";
import { mapGetters, mapState } from "vuex";
import StarIcon from "../../assets/images/StarIcon";

/**
 * This component shows a modal to inform the user about auto-splitting suggestions
 */
export default {
  name: "SplittingSuggestionsModal",
  components: {
    StarIcon,
  },
  data() {
    return {
      isModalActive: false,
      recommended: this.$t("recommended"),
    };
  },
  computed: {
    ...mapState("document", ["splittingSuggestions", "selectedDocument"]),
    ...mapGetters("document", ["waitingForSplittingConfirmation"]),
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
          if (
            this.splittingSuggestions &&
            this.splittingSuggestions.length > 0
          ) {
            this.$refs.bodyText.innerHTML = this.$t("split_modal_body", {
              number_of_split_documents: this.splittingSuggestions.length,
            });
          } else {
            this.$refs.bodyText.innerHTML = this.$t(
              "split_modal_no_suggestions"
            );
          }
        });
      }
    },
  },
  mounted() {
    if (this.splittingSuggestions) {
      this.isModalActive = true;
    }

    nextTick(() => {
      if (this.recommended) {
        this.recommended = this.recommended.toUpperCase();
      }
    });
  },
  methods: {
    closeModal() {
      const updatedDocument = [
        {
          name: this.selectedDocument.data_file_name,
          category: this.selectedDocument.category,
          pages: this.selectedDocument.pages,
        },
      ];

      this.$store.dispatch("edit/editDocument", updatedDocument);

      this.$store.dispatch("display/setCategorizeModalIsActive", false);
      this.isModalActive = false;
    },
    handleReviewNow() {
      this.$store.dispatch("edit/enableEditMode");
      this.isModalActive = false;
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/splitting_confirmation_modal.scss"
></style>
