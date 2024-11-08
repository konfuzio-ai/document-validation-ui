<template>
  <b-dropdown
    v-if="
      documentSet && documentSet.documents && documentSet.documents.length > 0
    "
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
              `#${numberOfDocumentInSet(selectedDocument.id)} ${categoryName(
                selectedDocument.category
              )}`
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
      @click="handleDocumentClick(doc)"
    >
      <span>
        {{
          `#${numberOfDocumentInSet(doc.id)} ${categoryName(doc.category)}`
        }}</span
      >
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import CategoryIcon from "../../assets/images/CategoryIconImg";

export default {
  name: "DocumentSetChooser",
  components: {
    CategoryIcon,
  },
  computed: {
    ...mapGetters("document", ["numberOfDocumentInSet"]),
    ...mapGetters("category", ["categoryName"]),
    ...mapState("document", ["documentSet", "selectedDocument"]),
  },
  methods: {
    handleDocumentClick(document) {
      this.$store.dispatch("document/changeCurrentDocument", {
        document,
        documentId: document.id,
      });
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_set_chooser.scss"
></style>
