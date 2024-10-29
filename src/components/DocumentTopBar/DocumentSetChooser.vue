<template>
  <b-dropdown
    v-if="documentSet && documentSet.length > 0"
    class="document-set-dropdown"
    aria-role="list"
    scrollable
  >
    <template #trigger>
      <div>
        <div class="icon">
          <CategoryIcon />
        </div>
        <div class="text"></div>
      </div>
    </template>

    <b-dropdown-item
      v-for="doc in documentSet"
      :key="doc.id"
      aria-role="listitem"
      class="list-item"
      @click="handleDocumentClick(doc)"
    >
      <span>{{ doc.name }}</span>
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import { mapState } from "vuex";
import CategoryIcon from "../../assets/images/CategoryIconImg";

export default {
  name: "DocumentSetChooser",
  components: {
    CategoryIcon,
  },
  computed: {
    ...mapState("document", ["documentSet"]),
  },
  methods: {
    handleDocumentClick(document) {
      console.log("doc", document);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_set_chooser.scss"
></style>
