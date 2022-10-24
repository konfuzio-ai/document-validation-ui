<style scoped lang="scss" src="../../assets/scss/categorize_modal.scss"></style>

<template>
  <section class="categorize-modal" v-if="document">
    <b-modal
      v-model="show"
      :can-cancel="['x']"
      class="modal-absolute modal-400"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>{{ $t("categorize_document_title") }}</h3>
          <p>
            {{ $t("categorized_as")
            }}<strong>{{ categoryName(document.category) }}</strong
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
                  <CaretDown />
                </div>
              </div>
            </template>
            <b-dropdown-item
              v-for="category in categories"
              :key="category.id"
              aria-role="listitem"
            >
              <span>{{ category.name }}</span>
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </section>
      <footer class="modal-card-foot">
        <b-button type="is-primary" @click="submit">
          {{ $t("submit") }}
        </b-button>
      </footer>
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
    document: {
      required: true,
      default: null
    }
  },
  components: {
    CaretDown
  },
  computed: {
    ...mapGetters("category", ["categoryName"]),
    ...mapState("category", ["categories"])
  },
  data() {
    return {
      selectedCategoryId: document ? document.category : 0
    };
  },
  methods: {
    submit() {
      if (selectedCategoryId !== document.category) {
        // TODO: Implement
      }
      this.$emit("close");
    }
  }
};
</script>
