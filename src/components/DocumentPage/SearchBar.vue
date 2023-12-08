<template>
  <transition
    mode="out-in"
    enter-active-class="animate__animated animate__fast animate__slideInDown"
    leave-active-class="animate__animated animate__faster animate__slideOutUp"
  >
    <div class="document-search">
      <div class="search-container">
        <div
          style="font-size: 20px; margin: 0 10px; cursor: pointer"
          @click="$store.dispatch('display/toggleSearch')"
        >
          <img
            src="/static/images/close.svg"
            style="height: 10px; padding-bottom: 2px"
          />
        </div>
        <input
          ref="searchInput"
          v-model="search"
          :placeholder="$t('search')"
          class="search-input"
          @keyup.13="focusSearchResult(1)"
        />
        <div class="search-loading">
          <template v-if="searchLoading">
            <svg
              class="spinner"
              width="20px"
              height="20px"
              viewBox="0 0 66 66"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="path"
                fill="none"
                stroke-width="6"
                stroke-linecap="round"
                cx="33"
                cy="33"
                r="30"
              ></circle>
            </svg>
          </template>
          <template v-else-if="searchResults.length">
            {{ currentSearchResult + 1 }} / {{ searchResults.length }}
            <img
              src="/static/images/caret-down.svg"
              style="
                margin-left: 8px;
                height: 8px;
                vertical-align: middle;
                cursor: pointer;
              "
              @click="focusSearchResult(1)"
            />
            <img
              src="/static/images/caret-up.svg"
              style="
                margin-left: 8px;
                margin-right: 4px;
                height: 8px;
                vertical-align: middle;
                cursor: pointer;
              "
              @click="focusSearchResult(-1)"
            />
          </template>
          <template v-else-if="search.length >= 3">
            {{ $t("no_results") }}
          </template>
        </div>
      </div>
    </div>
  </transition>
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
