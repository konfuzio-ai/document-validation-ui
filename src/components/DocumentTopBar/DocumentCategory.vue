<style
  scoped
  lang="scss"
  src="../../assets/scss/document_category.scss"
></style>

<template>
  <b-dropdown class="category-chooser" aria-role="list">
    <template #trigger>
      <div class="category-drop-down">
        <div class="icon">
          <CategoryIcon />
        </div>
        <div class="category-info">
          <p class="category-title">{{ $t("category") }}</p>
          <div class="category-name">
            {{ categoryName(selectedDocument.category) }}
          </div>
        </div>
        <div class="caret">
          <CaretDown />
        </div>
      </div>
    </template>

    <b-dropdown-item
      v-for="category in currentProjectCategories"
      v-bind:key="category.id"
      aria-role="listitem"
      v-on:click="handleChangeCategory(category)"
      :disabled="category.id === selectedDocument.category"
    >
      <span>{{ category.name }}</span>
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import CategoryIcon from "../../assets/images/CategoryIconImg.vue";
import CaretDown from "../../assets/images/TopBarCaretDownImg.vue";

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
    handleShowError: {
      type: Function
    },
    handleMessage: {
      type: Function
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
    ...mapState("category", ["categories"])
  },
  methods: {
    handleChangeCategory(category) {
      const updatedCategory = {
        category: category.id
      };
      this.$store
        .dispatch("document/updateDocument", updatedCategory)
        .then(response => {
          if (!response) {
            this.handleShowError();
            this.handleMessage(this.$i18n.t("category_error"));
          }
          // update document list if visible
          if (process.env.VUE_APP_CATEGORY_ID) {
            this.$store.dispatch("category/fetchDocumentList");
          }
        });
    }
  },
  mounted() {
    this.categories.map(category => {
      if (category.project === this.selectedDocument.project) {
        this.currentProjectCategories.push(category);
      }
    });
  }
};
</script>
