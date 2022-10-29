<style scoped lang="scss" src="../../assets/scss/categorize_modal.scss"></style>

<template>
  <section class="categorize-modal">
    <b-modal
      ref="modal"
      v-model="show"
      :can-cancel="documentCategory !== null"
      class="modal-absolute modal-400 modal-no-footer"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>{{ $t("categorize_document_title") }}</h3>
          <p v-if="documentCategory">
            {{ $t("categorized_as")
            }}<strong>{{ documentCategory.name }}</strong
            >.&nbsp;{{ $t("categorized_error") }}
          </p>
          <p v-else>{{ $t("not_categorized") }}</p>
          <b-dropdown
            aria-role="list"
            v-model="selectedCategory"
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
            >
              <span>{{ categoryItem.name }}</span>
            </b-dropdown-item>
          </b-dropdown>
          <div class="category-description" v-if="selectedCategory">
            {{
              selectedCategory.description
                ? selectedCategory.description
                : $t("categorize_document_no_category_description")
            }}
          </div>
          <div class="category-description" v-else>
            {{ $t("select_category") }}
          </div>
          <b-button
            class="submit-category"
            type="is-primary"
            @click="submit"
            :disabled="!selectedCategory"
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
    ...mapGetters("document", ["categorizationIsConfirmed"])
  },
  data() {
    return {
      show: false,
      selectedCategory: null, // category selected in dropdown
      documentCategory: null // category associated to document
    };
  },
  mounted() {
    this.setDocumentValues();
  },
  methods: {
    setDocumentValues() {
      const category = this.category(this.selectedDocument.category);
      this.selectedCategory = category;
      this.documentCategory = category;
      this.show = !this.categorizationIsConfirmed;
    },
    submit() {
      if (this.selectedCategory.id !== this.category.id) {
        const updatedCategory = {
          category: this.selectedCategory.id,
          is_category_accepted: true
        };
        this.$store.dispatch("document/startRecalculatingAnnotations");

        this.$store
          .dispatch("document/updateDocument", updatedCategory)
          .then(response => {
            if (response) {
              // TODO: this should be done on the update document endpoint
              // Poll document data until the status_data is 111 (error) or
              // 2 and labeling is available (done)
              this.$store.dispatch("document/pollDocumentEndpoint", 5000);
            } else {
              this.$store.dispatch("document/endRecalculatingAnnotations");
              this.$store.dispatch(
                "document/setErrorMessage",
                this.$t("category_error")
              );
            }
          });
      } else {
        // if same category, then just accept it
        this.$store.dispatch("document/updateDocument", {
          is_category_accepted: true
        });
      }
      this.$emit("close");
    }
  },
  watch: {
    selectedDocument(newValue) {
      if (newValue) {
        this.setDocumentValues();
      }
    }
  }
};
</script>
