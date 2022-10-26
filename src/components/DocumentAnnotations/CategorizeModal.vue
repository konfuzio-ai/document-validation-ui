<style scoped lang="scss" src="../../assets/scss/categorize_modal.scss"></style>

<template>
  <section class="categorize-modal" v-if="category">
    <b-modal
      v-model="show"
      :can-cancel="['x']"
      class="modal-absolute modal-400 modal-no-footer"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>{{ $t("categorize_document_title") }}</h3>
          <p>
            {{ $t("categorized_as") }}<strong>{{ category.name }}</strong
            >.&nbsp;{{ $t("categorized_error") }}
          </p>
          <b-dropdown
            aria-role="list"
            v-model="selectedCategoryId"
            class="categorize-dropdown"
          >
            <template #trigger>
              <div class="category-dropdown">
                <div>
                  <span>{{ categoryName(selectedCategoryId) }}</span>
                </div>
              </div>
            </template>
            <b-dropdown-item
              v-for="categoryItem in categories"
              :key="categoryItem.id"
              aria-role="listitem"
              :value="categoryItem.id"
            >
              <span>{{ categoryItem.name }}</span>
            </b-dropdown-item>
          </b-dropdown>
          <div class="category-description">
            {{
              category.description
                ? category.description
                : $t("categorize_document_no_category_description")
            }}
          </div>
          <b-button class="submit-category" type="is-primary" @click="submit">
            {{ $t("submit") }}
          </b-button>
        </div>
      </section>
    </b-modal>
  </section>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import CaretDown from "../../assets/images/TopBarCaretDownImg";

export default {
  name: "CategorizeModal",
  props: {
    show: {
      required: true,
      default: false
    },
    category: {
      required: true,
      default: null
    }
  },
  computed: {
    ...mapGetters("category", ["categoryName"]),
    ...mapState("category", ["categories"])
  },
  data() {
    return {
      selectedCategoryId: this.category ? this.category.id : 0
    };
  },
  methods: {
    submit() {
      if (this.selectedCategoryId !== this.category.id) {
        const updatedCategory = {
          category: this.selectedCategoryId,
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
  }
};
</script>
