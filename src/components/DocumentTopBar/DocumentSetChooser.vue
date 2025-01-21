<template>
  <b-dropdown
    v-if="
      documentSet &&
      documentSet.documents &&
      documentSet.documents.length > 1 &&
      categories
    "
    v-model="selectedDocId"
    class="document-set-dropdown dropdown-full-width"
    aria-role="list"
    scrollable
  >
    <template #trigger>
      <div class="dropdown-doc-set">
        <div class="dropdown-left">
          <CategoryIcon />
        </div>
        <div class="dropdown-text">
          <div class="top-part">
            {{ $t("document_section") }}
          </div>
          <div class="bottom-part">
            {{
              `${categoryName(
                selectedDocument.category
              )} ${numberOfDocumentInSet(selectedDocument)}`
            }}
          </div>
        </div>
        <div class="dropdown-right">
          <b-icon icon="angle-down" size="is-small" class="caret" />
        </div>
      </div>
    </template>

    <b-dropdown-item
      v-for="doc in documentSet.documents"
      :key="doc.id"
      aria-role="listitem"
      class="list-item"
      :value="doc.id"
      @click="handleDocumentClick(doc)"
    >
      <span>
        {{
          `${categoryName(doc.category)} ${numberOfDocumentInSet(doc)}`
        }}</span
      >
    </b-dropdown-item>
  </b-dropdown>
  <div
    v-else-if="selectedDocument.documentSet !== null && documentSet === null"
    class="loading-bar"
  >
    <b-skeleton width="100px" height="60%" />
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import CategoryIcon from "../../assets/images/CategoryIconImg";

export default {
  name: "DocumentSetChooser",
  components: {
    CategoryIcon,
  },
  data() {
    return {
      selectedDocId: 0,
    };
  },
  computed: {
    ...mapGetters("document", ["numberOfDocumentInSet"]),
    ...mapGetters("category", ["categoryName"]),
    ...mapState("document", ["documentSet", "selectedDocument"]),
    ...mapState("category", ["categories"]),
  },
  mounted() {
    this.selectedDocId = this.selectedDocument.id;
  },
  methods: {
    handleDocumentClick(document) {
      this.$store.dispatch("document/changeCurrentDocument", document.id);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_set_chooser.scss"
></style>
