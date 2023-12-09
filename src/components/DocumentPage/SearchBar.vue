<template>
  <div class="document-search">
    <div class="search-container">
      <input
        ref="searchInput"
        v-model="search"
        :placeholder="$t('search')"
        class="search-input"
        @keyup.13="focusSearchResult(1)"
      />
      <div v-if="searchLoading" class="search-loading"></div>

      <div v-if="search.length >= 3" class="search-no-results">
        {{ $t("no_results") }}
      </div>
      <div v-else class="search-navigation">
        <span class="search-counters"
          >{{ currentSearchResult }}/{{ searchResults.length }}</span
        >
        <b-button
          class="is-ghost is-small"
          :disabled="!searchResults.length"
          @click="focusSearchResult(1)"
          ><b-icon icon="angle-down" class="is-small"
        /></b-button>

        <b-button
          class="is-ghost is-small"
          :disabled="!searchResults.length"
          @click="focusSearchResult(-1)"
          ><b-icon icon="angle-up" class="is-small"
        /></b-button>
      </div>
      <div class="search-close">
        <b-button
          class="is-ghost is-small"
          @click="$store.dispatch('display/toggleSearch')"
        >
          <b-icon icon="xmark" class="is-small" />
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "SearchBar",
  data() {
    return {
      search: "",
    };
  },
  computed: {
    ...mapState("display", [
      "currentSearchResult",
      "searchEnabled",
      "searchResults",
      "searchLoading",
    ]),
  },
  watch: {
    search(search) {
      if (search.length >= 3) {
        this.$store.dispatch("display/startSearchLoading");
      }
      this.$store.dispatch("display/debounceSearch", search);
    },

    searchEnabled(enabled) {
      if (enabled) {
        this.$nextTick(() => {
          this.$refs.searchInput.focus();
        });
      }
    },
  },
  methods: {
    focusSearchResult(n) {
      this.$store.dispatch("display/setCurrentSearchResult", n);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_search_bar.scss"
></style>
