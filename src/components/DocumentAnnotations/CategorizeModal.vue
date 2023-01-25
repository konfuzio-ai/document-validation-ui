<template>
  <section class="categorize-modal">
    <b-modal
      ref="modal"
      v-model="show"
      :can-cancel="canCloseModal()"
      class="modal-absolute modal-400 modal-no-footer"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>{{ $t("categorize_document_title") }}</h3>
          <p v-if="documentCategory">
            {{ $t("categorized_as")
            }}<strong>&nbsp;{{ documentCategory.name }}</strong
            >.&nbsp;{{ $t("categorized_error") }}
          </p>
          <p v-else>
            {{ $t("not_categorized") }}
          </p>
          <b-dropdown
            v-model="selectedCategory"
            aria-role="list"
            class="categorize-dropdown"
          >
            <template #trigger>
              <div class="category-dropdown">
                <div>
                  <span v-if="selectedCategory">{{
                    selectedCategory.name
                  }}</span>
                  <span v-else>{{ $t("choose_category") }}</span>
                </div>
              </div>
            </template>
            <b-dropdown-item
              v-for="categoryItem in categories"
              :key="categoryItem.id"
              aria-role="listitem"
              :value="categoryItem"
              @click="setSelectedCategory(categoryItem)"
            >
              <span>{{ categoryItem.name }}</span>
            </b-dropdown-item>
          </b-dropdown>
          <div v-if="selectedCategory" class="category-description">
            {{
              selectedCategory.description
                ? selectedCategory.description
                : $t("categorize_document_no_category_description")
            }}
          </div>
          <div v-else class="category-description">
            {{ $t("select_category") }}
          </div>
          <b-button
            class="submit-category"
            type="is-primary"
            :disabled="!selectedCategory"
            @click="submit"
          >
            {{ $t("submit") }}
          </b-button>
        </div>
      </section>
    </b-modal>
  </section>
</template>

<script>
/**
 * This component shows a modal to categorize a document
 */

import { mapGetters, mapState } from "vuex";

export default {
  name: "CategorizeModal",
  computed: {
    ...mapState("category", ["categories"]),
    ...mapState("document", ["selectedDocument"]),
    ...mapGetters("category", ["category"]),
    ...mapGetters("document", ["categorizationIsConfirmed"]),
  },
  data() {
    return {
      show: false,
      selectedCategory: null, // category selected in dropdown
      documentCategory: null, // category associated to document
    };
  },
  watch: {
    selectedDocument(newValue) {
      if (newValue) {
        this.setDocumentValues();
      }
    },
    categories(newCategories, oldCategories) {
      if (newCategories && oldCategories === null) {
        this.setDocumentValues();
      }
    },
  },
  mounted() {
    this.setDocumentValues();
  },
  methods: {
    setDocumentValues() {
      if (this.selectedDocument) {
        const category = this.category(this.selectedDocument.category);
        this.selectedCategory = category;
        this.documentCategory = category;
        this.show = !this.categorizationIsConfirmed;
      }
    },
    canCloseModal() {
      return !!this.documentCategory && this.documentCategory.id !== null;
    },
    setSelectedCategory(category) {
      this.selectedCategory = category;
    },
    submit() {
      if (
        (this.selectedCategory &&
          this.documentCategory &&
          this.selectedCategory.id !== this.documentCategory.id) ||
        (this.selectedCategory && !this.documentCategory)
      ) {
        const updatedCategory = {
          category: this.selectedCategory.id,
          is_category_accepted: true,
        };

        this.$store.dispatch("document/startRecalculatingAnnotations");

        this.$store
          .dispatch("document/updateDocument", updatedCategory)
          .catch((error) => {
            this.$store.dispatch("document/createErrorMessage", {
              error,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          })
          .finally(() => {
            this.$store.dispatch("document/endRecalculatingAnnotations");
          });
      } else {
        // if same category, then just accept it
        this.$store.dispatch("document/updateDocument", {
          is_category_accepted: true,
        });
      }
      this.show = false;
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/categorize_modal.scss"></style>
