<template>
  <section class="categorize-modal">
    <b-modal
      ref="modal"
      v-model="show"
      :can-cancel="canCloseModal()"
      class="modal-absolute modal-400 modal-no-footer"
    >
      <section class="modal-card-body scroll-hidden">
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

          <b-tooltip
            multilined
            :active="singleCategoryInProject"
            size="is-large"
            position="is-bottom"
            class="bottom-aligned"
            :close-delay="5000"
          >
            <template #content>
              <div ref="tooltipContent"></div>
            </template>
            <b-dropdown
              v-model="selectedCategory"
              aria-role="list"
              :class="[
                'categorize-dropdown',
                singleCategoryInProject && 'dropdown-disabled',
              ]"
              :disabled="singleCategoryInProject"
            >
              <template #trigger>
                <div class="category-dropdown">
                  <div>
                    <span v-if="selectedCategory">{{
                      selectedCategory.name
                    }}</span>
                    <span v-else-if="singleCategoryInProject">{{
                      categories[0].name
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
          </b-tooltip>
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
  data() {
    return {
      show: false,
      selectedCategory: null, // category selected in dropdown
      documentCategory: null, // category associated to document
    };
  },
  computed: {
    ...mapState("category", ["categories"]),
    ...mapState("document", ["selectedDocument"]),
    ...mapGetters("category", ["category"]),
    ...mapGetters("document", ["categorizationIsConfirmed"]),

    singleCategoryInProject() {
      // if only 1 category in the project, we don't enable the dropdown
      return this.categories && this.categories.length === 1;
    },
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

        if (newCategories.length === 1) {
          this.setTooltipText();
        }
      }
    },
    show(newValue) {
      this.$store.dispatch("document/setCategorizeModalIsActive", newValue);
    },
  },
  mounted() {
    this.setDocumentValues();

    this.$nextTick(() => {
      this.setTooltipText();
    });
  },
  updated() {
    this.setTooltipText();
  },
  methods: {
    setDocumentValues() {
      if (this.selectedDocument) {
        let category;

        // Check if the document has an extracted category
        // or if it doesn't, but the project has only 1 category
        if (this.selectedDocument.category) {
          category = this.category(this.selectedDocument.category);
          this.documentCategory = category;
        } else if (this.categories && this.categories.length === 1) {
          category = this.category(this.categories[0].id);
        } else {
          category = category;
        }

        this.selectedCategory = category;
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
        (this.selectedCategory && !this.documentCategory) ||
        (this.selectedCategory && this.singleCategoryInProject)
      ) {
        const updatedCategory = {
          category: this.selectedCategory.id,
          category_is_revised: true,
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
          category_is_revised: true,
        });
      }
      this.show = false;
    },
    setTooltipText() {
      // Text set from innerHTML vs 'label' due to html tag in locales file string
      if (this.singleCategoryInProject && this.show) {
        this.$refs.tooltipContent.innerHTML = this.$t(
          "single_category_in_project"
        );
      }
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/categorize_modal.scss"></style>
