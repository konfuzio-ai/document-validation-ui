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
    <div class="smart-split">
      <b-tooltip
        multilined
        :active="!documentHasProposedSplit(selectedDocument)"
        position="is-bottom"
        class="bottom-aligned split-tooltip"
        :label="tooltipInfo"
      >
        <b-field>
          <b-switch
            v-model="switchStatus"
            :value="true"
            size="is-small"
            :disabled="!documentHasProposedSplit(selectedDocument)"
            class="split-switch"
          />
          <div class="switch-info">
            <span class="switch-text">{{ $t("smart_split") }}</span>
          </div>
        </b-field>
      </b-tooltip>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
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
  props: {
    splitSuggestionsEnabled: {
      type: Boolean,
    },
  },
  data() {
    return {
      buttonDisabled: true,
      tooltipInfo: null,
      switchStatus: true,
    };
  },
  computed: {
    ...mapState("edit", ["selectedPages", "updatedDocument"]),
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
    splitSuggestionsEnabled(newValue) {
      if (!newValue) {
        this.switchStatus = false;
      }
    },
    updatedDocument(newValue) {
      if (newValue && newValue.length === 1) {
        this.switchStatus = false;
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.switchStatus = this.splitSuggestionsEnabled;
      this.tooltipInfo = this.$t("no_splitting_suggestions");
    });
  },
  methods: {
    rotateLeft() {
      this.$emit("rotate", "left");
    },
    rotateRight() {
      this.$emit("rotate", "right");
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
