<style scoped lang="scss" src="../assets/scss/document_category.scss"></style>

<template>
  <b-dropdown
    :class="[
      'category-chooser',
      splitMode && 'split-mode',
      selectedDocument.is_reviewed && 'disabled'
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
          <p class="category-title" v-if="!splitMode">{{ $t("category") }}</p>
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
          ></b-icon>
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
import CategoryIcon from "../assets/images/CategoryIconImg";

export default {
  name: "DocumentCategory",
  data() {
    return {
      currentProjectCategories: [],
      categoryError: false
    };
  },
  props: {
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
    CategoryIcon
  },
  computed: {
    ...mapGetters("category", {
      categoryName: "categoryName"
    }),
    ...mapState("document", ["selectedDocument"]),
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
      // handling the category change will be different based on
      // the dropdown being on the topbar or the split overview
      const updatedCategory = {
        category: category.id
      };

      if (!this.splitMode) {
        this.$store.dispatch("document/startRecalculatingAnnotations");

        this.$store
          .dispatch("document/updateDocument", updatedCategory)
          .then(response => {
            if (response === 200) {
              // Poll document data until the status_data is 111 (error) or
              // 2 and labeling is available (done)
              this.$store.dispatch("document/pollDocumentEndpoint", 1000);
            } else {
              const resp = JSON.stringify(response);

              if (resp.includes("500")) {
                this.$store.dispatch(
                  "document/setErrorMessage",
                  this.$t("category_server_error")
                );
              } else {
                this.$store.dispatch(
                  "document/setErrorMessage",
                  this.$t("category_error")
                );
              }
            }
          })
          .finally(() => {
            this.$store.dispatch("document/endRecalculatingAnnotations");
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
          const found = this.currentProjectCategories.find(
            cat => cat.id === category.id
          );
          if (found) return;

          this.currentProjectCategories.push(category);
        }
      });
    }
  },
  mounted() {
    if (this.categories) {
      this.categories.map(category => {
        if (category.project === this.selectedDocument.project) {
          const found = this.currentProjectCategories.find(
            cat => cat.id === category.id
          );
          if (found) return;

          this.currentProjectCategories.push(category);
        }
      });
    }
  }
};
</script>
