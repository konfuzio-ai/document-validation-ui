<template>
  <div id="document-search">
    <div class="search-container">
      <input
        ref="searchInput"
        v-model="search"
        :placeholder="$t('search')"
        class="search-input"
        @keyup.13="focusSearchResult(1)"
      />
      <div v-if="searchLoading" class="search-loading">
        <b-icon icon="spinner" class="fa-spin loading-icon-size spinner" />
      </div>

      <div
        v-else-if="
          searchResults.length === 0 && search.length >= minSearchLength
        "
        class="search-no-results"
      >
        {{ $t("no_results") }}
      </div>
      <div v-else class="search-navigation">
        <span v-if="searchBelowMinimum" class="search-counters">
          {{ $t("search_below_minimum") }}
        </span>
        <span v-else class="search-counters"
          >{{ currentCounter }}/{{ searchResults.length }}</span
        >
        <b-button
          v-if="!searchBelowMinimum"
          class="is-ghost is-small next-search"
          :disabled="!searchResults.length || searchResults.length <= 1"
          @click="focusSearchResult(1)"
          ><b-icon icon="angle-down" class="is-small"
        /></b-button>

        <b-button
          v-if="!searchBelowMinimum"
          class="is-ghost is-small previous-search"
          :disabled="!searchResults.length || searchResults.length <= 1"
          @click="focusSearchResult(-1)"
          ><b-icon icon="angle-up" class="is-small"
        /></b-button>
      </div>
      <div class="search-close">
        <b-button class="is-ghost is-small" @click="closeSearch">
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
      minSearchLength: 3,
    };
  },
  computed: {
    ...mapState("display", [
      "currentSearchResult",
      "currentSearch",
      "searchEnabled",
      "searchResults",
      "searchLoading",
    ]),
    searchBelowMinimum() {
      return (
        this.search &&
        this.search.length > 0 &&
        this.search.length < this.minSearchLength
      );
    },
    currentCounter() {
      return this.currentSearchResult != null && this.searchResults.length > 0
        ? this.currentSearchResult + 1
        : 0;
    },
  },
  watch: {
    search(search) {
      console.log("search", search);
      this.$store.dispatch("display/setCurrentSearch", search);
      if (search.length >= this.minSearchLength) {
        this.$store.dispatch("display/startSearchLoading");
      }
      this.$store.dispatch("display/debounceSearch", search);
    },
    currentSearch(search) {
      if (this.search !== search) {
        this.search = search;
      }
    },
    searchEnabled(enabled) {
      if (enabled) {
        this.$nextTick(() => {
          this.$refs.searchInput.focus();
        });
      }
    },
  },
  mounted() {
    if (this.currentSearch !== this.search) {
      this.search = this.currentSearch;
    }
  },
  methods: {
    focusSearchResult(n) {
      this.$store.dispatch("display/setCurrentSearchResult", n);
    },
    closeSearch() {
      this.$store.dispatch("display/resetSearch");
      this.$store.dispatch("display/toggleSearch");
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_search_bar.scss"
></style>
