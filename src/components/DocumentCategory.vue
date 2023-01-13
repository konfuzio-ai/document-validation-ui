<template>
  <b-dropdown
    :class="[
      'category-chooser',
      splitMode && 'split-mode',
      selectedDocument.is_reviewed && 'disabled',
    ]"
    aria-role="list"
    :disabled="selectedDocument.is_reviewed"
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
            {{
              !splitMode
                ? categoryName(selectedDocument.category)
                : categoryName(updatedDocument[index].category)
            }}
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
      v-for="category in currentProjectCategories"
      :key="category.id"
      aria-role="listitem"
      :disabled="handleOptionInDropdownDisabled(category)"
      @click="handleChangeCategory(category)"
    >
      <span>{{ category.name }}</span>
    </b-dropdown-item>
  </b-dropdown>
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
    },
    index: {
      type: Number,
    },
  },
  data() {
    return {
      currentProjectCategories: [],
      categoryError: false,
    };
  },
  computed: {
    ...mapGetters("category", {
      categoryName: "categoryName",
    }),
    ...mapState("document", ["selectedDocument"]),
    ...mapState("category", ["categories"]),
    ...mapState("edit", ["updatedDocument"]),
  },
  watch: {
    categories(newValue) {
      newValue.map((category) => {
        if (category.project === this.selectedDocument.project) {
          const found = this.currentProjectCategories.find(
            (cat) => cat.id === category.id
          );
          if (found) return;

          this.currentProjectCategories.push(category);
        }
      });
    },
  },
  mounted() {
    if (this.categories) {
      this.categories.map((category) => {
        if (category.project === this.selectedDocument.project) {
          const found = this.currentProjectCategories.find(
            (cat) => cat.id === category.id
          );
          if (found) return;

          this.currentProjectCategories.push(category);
        }
      });
    }
  },
  methods: {
    // The current category name will change
    // depending on if we are on edit mode or not
    handleOptionInDropdownDisabled(category) {
      if (!this.splitMode)
        return category.id === this.selectedDocument.category;

      return category.id === this.updatedDocument[this.index].category;
    },

    handleChangeCategory(category) {
      // handling the category change will be different based on
      // the dropdown being on the topbar or the split overview
      const updatedCategory = {
        category: category.id,
      };

      if (!this.splitMode) {
        this.$store.dispatch("document/startRecalculatingAnnotations");

        this.$store
          .dispatch("document/updateDocument", updatedCategory)
          .then((response) => {
            if (!response) return;

            this.$store.dispatch("document/createErrorMessage", {
              response,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          })
          .finally(() => {
            this.$store.dispatch("document/endRecalculatingAnnotations");
          });

        return;
      }

      // Send the category ID to the split overview
      // to update the new document category
      this.$emit("category-change", this.page, category.id);
    },
  },
};
</script>

<style scoped lang="scss" src="../assets/scss/document_category.scss"></style>
