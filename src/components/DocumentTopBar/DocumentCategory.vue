<style
  scoped
  lang="scss"
  src="../../assets/scss/document_category.scss"
></style>

<template>
  <b-dropdown
    :class="['category-chooser', splitMode && 'split-mode']"
    aria-role="list"
  >
    <template #trigger>
      <div class="category-drop-down">
        <div class="icon">
          <CategoryIcon />
        </div>
        <div class="category-info">
          <p class="category-title" v-if="!splitMode">{{ $t("category") }}</p>
          <div class="category-name">
            {{
              !splitMode
                ? categoryName(selectedDocument.category)
                : categoryName(updatedDocument[index].category)
            }}
          </div>
        </div>
        <div :class="['caret', splitMode && 'split-mode-caret']">
          <CaretDown />
        </div>
      </div>
    </template>

    <b-dropdown-item
      v-for="category in currentProjectCategories"
      v-bind:key="category.id"
      aria-role="listitem"
      v-on:click="handleChangeCategory(category)"
      :disabled="handleOptionInDropdownDisabled(category)"
    >
      <span>{{ category.name }}</span>
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import CategoryIcon from "../../assets/images/CategoryIconImg";
import CaretDown from "../../assets/images/TopBarCaretDownImg";

export default {
  name: "DocumentCategory",
  data() {
    return {
      currentProjectCategories: [],
      categoryError: false
    };
  },
  props: {
    selectedDocument: {
      type: Object
    },
    handleError: {
      type: Function
    },
    handleMessage: {
      type: Function
    },
    splitMode: {
      type: Boolean
    },
    page: {
      type: Object
    },
    index: {
      type: Number
    }
  },
  components: {
    CategoryIcon,
    CaretDown
  },
  computed: {
    ...mapGetters("category", {
      categoryName: "categoryName"
    }),
    ...mapState("category", ["categories"]),
    ...mapState("edit", ["updatedDocument"])
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
      const updatedCategory = {
        category: category.id
      };

      if (!this.splitMode) {
        this.$store
          .dispatch("document/updateDocument", updatedCategory)
          .then(response => {
            if (!response) {
              this.handleError();
              this.handleMessage(this.$t("category_error"));
            }
            // update document list if visible
            if (process.env.VUE_APP_CATEGORY_ID) {
              this.$store.dispatch("category/fetchDocumentList");
              this.$store.dispatch("category/setAvailableDocumentsList");
            }
          });

        return;
      }
      // Send the category ID to the split overview
      // to update the new document category
      this.$emit("category-change", this.page, category.id);
    }
  },
  watch: {
    categories(newValue) {
      newValue.map(category => {
        if (category.project === this.selectedDocument.project) {
          this.currentProjectCategories.push(category);
        }
      });
    }
  },
  mounted() {
    if (this.categories) {
      this.categories.map(category => {
        if (category.project === this.selectedDocument.project) {
          this.currentProjectCategories.push(category);
        }
      });
    }
  }
};
</script>
