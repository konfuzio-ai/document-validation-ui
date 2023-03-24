<template>
  <div class="edit-sidebar">
    <div class="buttons-container">
      <div class="rotate-selected edit-buttons">
        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="buttonDisabled"
          :button-text="$t('rotate_selected')"
          :icon="'arrow-rotate-left'"
          @rotate="rotateLeft"
        />

        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="buttonDisabled"
          :button-text="$t('rotate_selected')"
          :icon="'arrow-rotate-right'"
          @rotate="rotateRight"
        />

        <p :class="['pages-selected', buttonDisabled && 'disabled']">
          {{ selectedPages.length }} {{ $t("selected") }}
        </p>
      </div>

      <div class="rotate-all edit-buttons">
        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="false"
          :button-text="$t('rotate_all')"
          :icon="'arrow-rotate-left'"
          @rotate="rotateAllLeft"
        />

        <SidebarButtons
          :show-rotate-button="true"
          :button-disabled="false"
          :button-text="$t('rotate_all')"
          :icon="'arrow-rotate-right'"
          @rotate="rotateAllRight"
        />
      </div>
    </div>
    <div class="split smart-split">
      <b-tooltip
        multilined
        :active="!documentHasProposedSplit(selectedDocument)"
        position="is-bottom"
        class="bottom-aligned"
        :label="tooltipInfo"
      >
        <b-field>
          <b-switch
            :value="true"
            size="is-small"
            v-model="switchStatus"
            :disabled="!documentHasProposedSplit(selectedDocument)"
          >
            <span class="switch-text">{{ $t("smart_split") }}</span>
            <span
              v-if="documentHasProposedSplit(selectedDocument)"
              class="new-badge"
              >{{ newText }}</span
            >
          </b-switch>
        </b-field>
      </b-tooltip>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { nextTick } from "vue";
import SidebarButtons from "./SidebarButtons";

/**
 * This component renders buttons to rotate single pages or all pages
 * in edit mode
 * */
export default {
  name: "EditSidebar",
  components: {
    SidebarButtons,
  },
  data() {
    return {
      buttonDisabled: true,
      tooltipInfo: null,
      newText: this.$t("new"),
      switchStatus: true,
    };
  },
  props: {
    splitSuggestionsEnabled: {
      type: Boolean,
    },
  },
  computed: {
    ...mapState("edit", ["selectedPages"]),
    ...mapState("document", ["splittingSuggestions", "selectedDocument"]),
    ...mapGetters("document", ["documentHasProposedSplit"]),
  },
  watch: {
    selectedPages(newValue) {
      if (newValue.length > 0) {
        this.buttonDisabled = false;
      } else {
        this.buttonDisabled = true;
      }
    },
    switchStatus(newValue) {
      if (this.splittingSuggestions && this.splittingSuggestions.length > 0)
        this.$emit("handle-splitting-suggestions", newValue);
    },
  },
  mounted() {
    this.tooltipInfo = this.$t("no_splitting_suggestions");

    nextTick(() => {
      if (this.newText) {
        this.newText = this.$t("new").toUpperCase();
      }

      this.switchStatus = this.splitSuggestionsEnabled;
    });
  },
  methods: {
    rotateLeft() {
      this.$emit("rotate-left", "left");
    },
    rotateRight() {
      this.$emit("rotate-right", "right");
    },
    rotateAllLeft() {
      this.$emit("rotate-all-left");
    },
    rotateAllRight() {
      this.$emit("rotate-all-right");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
