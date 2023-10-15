<template>
  <b-tooltip
    multilined
    :active="tooltipIsShown || dropdownIsDisabled"
    size="is-large"
    position="is-bottom"
    :class="[
      editMode
        ? 'right-aligned full-height-tooltip'
        : 'left-aligned full-height-tooltip',
    ]"
    :close-delay="tooltipCloseDelay"
  >
    <template #content>
      <div ref="tooltipContent"></div>
    </template>
    <b-dropdown
      :class="[
        'category-chooser',
        splitMode && 'split-mode',
        isDocumentReviewed && 'disabled',
      ]"
      aria-role="list"
      scrollable
      :disabled="dropdownIsDisabled"
    >
      <template #trigger>
        <div class="category-drop-down">
          <div class="icon">
            <CategoryIcon />
          </div>
          <div class="category-info">
            <p v-if="!splitMode" class="category-title">
              {{ $t("category") }}
            </p>
            <div class="category-name">
              <span>
                {{ setCategoryDefaultText }}
              </span>
              <span v-if="splitMode && setCategoryConfidence >= 0">
                {{ `(${setCategoryConfidence}%)` }}
              </span>
            </div>
          </div>
          <div :class="[!splitMode && 'caret-section']">
            <b-icon
              icon="angle-down"
              size="is-small"
              :class="['caret', splitMode && 'split-mode-caret']"
            />
          </div>
        </div>
      </template>

      <b-dropdown-item
        v-for="category in listOfCategories()"
        :key="category.id"
        aria-role="listitem"
        :disabled="handleOptionInDropdownDisabled(category)"
        @click="handleChangeCategory(category)"
      >
        <span>{{ category.name }}</span>
        <span v-if="splitMode && category.confidence >= 0">{{
          ` (${category.confidence}%)`
        }}</span>
      </b-dropdown-item>
    </b-dropdown>
  </b-tooltip>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import CategoryIcon from "../assets/images/CategoryIconImg";

export default {
  name: "DocumentCategory",
  components: {
    CategoryIcon,
  },
  props: {
    splitMode: {
      type: Boolean,
    },
    page: {
      type: Object,
      default: null,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      categoryError: false,
      tooltipIsShown: false,
      tooltipCloseDelay: 0,
      dropdownIsDisabled: false,
    };
  },
  computed: {
    ...mapGetters("category", ["categoryName", "projectHasSingleCategory"]),
    ...mapGetters("document", [
      "documentCannotBeEdited",
      "documentHasCorrectAnnotations",
      "isDocumentReviewed",
    ]),
    ...mapState("document", ["selectedDocument", "annotations"]),
    ...mapState("category", ["categories"]),
    ...mapState("edit", ["editMode", "updatedDocument"]),

    setCategoryDefaultText() {
      if (!this.splitMode) {
        return this.categoryName(this.selectedDocument.category);
      } else {
        const missingCategory = this.updatedDocument.find(
          (item) => !item.category
        );

        // if there is just 1 category in the project,
        // and one or more sub-documents has no category,
        // assign the only category by default
        if (this.projectHasSingleCategory && missingCategory) {
          const updatedValuesForDocuments = this.updatedDocument.map(
            (document) => {
              if (!document.category && this.categories) {
                document.category = this.categories[0].id;
              }

              return document;
            }
          );

          // update the store state
          // so that if the changes are saved the data sent to the API is updated
          // instead of only handling the category name in this component
          this.$store.dispatch(
            "edit/setUpdatedDocument",
            updatedValuesForDocuments
          );
        }

        const categoryName = this.categoryName(
          this.updatedDocument[this.index].category
        );

        return categoryName ? categoryName : this.$t("choose_category");
      }
    },

    setCategoryConfidence() {
      if (
        !this.updatedDocument[this.index].categories ||
        !this.categoryName(this.updatedDocument[this.index].category)
      )
        return;

      const found = this.updatedDocument[this.index].categories.find(
        (category) => category.id === this.updatedDocument[this.index].category
      );

      return this.handleCategoryConfidence(found.confidence);
    },
  },
  watch: {
    annotations() {
      this.checkIfDropdownIsDisabled();
      this.setTooltipText();
    },
  },
  mounted() {
    if (this.projectHasSingleCategory) {
      this.tooltipIsShown = true;
    }
  },
  updated() {
    this.setTooltipText();
    this.checkIfDropdownIsDisabled();
  },
  methods: {
    listOfCategories() {
      let list;

      if (this.splitMode && this.updatedDocument[this.index].categories) {
        list = this.handleCategories(
          this.updatedDocument[this.index].categories
        );
      } else if (this.categories) {
        const filtered = this.categories.filter(
          (category) => category.project === this.selectedDocument.project
        );
        list = this.handleCategories(filtered);
      }

      return list;
    },
    handleCategories(categories) {
      return categories.map((category) => {
        return {
          id: category.id,
          name: this.categoryName(category.id),
          confidence: this.handleCategoryConfidence(category.confidence),
        };
      });
    },
    handleCategoryConfidence(confidence) {
      if (!confidence) {
        if (confidence === 0) return confidence.toFixed(2);

        return;
      }

      return (confidence * 100).toFixed(2);
    },
    checkIfDropdownIsDisabled() {
      if (
        this.projectHasSingleCategory ||
        this.documentCannotBeEdited(this.selectedDocument) ||
        (this.documentHasCorrectAnnotations && !this.splitMode)
      ) {
        this.dropdownIsDisabled = true;
      } else {
        this.dropdownIsDisabled = false;
      }
    },
    // The current category name will change
    // depending on if we are on edit mode or not
    handleOptionInDropdownDisabled(category) {
      if (!this.splitMode)
        return category.id === this.selectedDocument.category;

      return category.id === this.updatedDocument[this.index].category;
    },
    handleChangeCategory(category) {
      // handling the category change will be different based on
      // the dropdown being on the topbar or the Rename and Categorize view
      const updatedCategory = {
        category: category.id,
      };

      if (!this.splitMode) {
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

        return;
      }

      // Send the category ID to the Rename and Categorize view
      // to update the new document category
      this.$emit("category-change", this.page, category.id);
    },
    setTooltipText() {
      // Text set from innerHTML vs 'label' due to html tag in locales file string
      let tooltipText;
      let tooltipDelay = 0;

      if (this.documentCannotBeEdited(this.selectedDocument)) {
        tooltipText = this.$t("edit_not_available");
      } else if (this.documentHasCorrectAnnotations) {
        tooltipText = this.$t("approved_annotations");
      } else if (this.projectHasSingleCategory) {
        tooltipText = this.$t("single_category_in_project");
        tooltipDelay = 5000;
      }

      this.tooltipCloseDelay = tooltipDelay;
      this.$refs.tooltipContent.innerHTML = tooltipText;
    },
  },
};
</script>

<style scoped lang="scss" src="../assets/scss/document_category.scss"></style>
