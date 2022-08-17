<style scoped lang="scss" src="../../assets/scss/edit_top_bar.scss"></style>
<template>
  <div class="edit-top-bar">
    <div class="split-top-bar option" v-if="splitOverview">
      <b-icon :icon="getIcon(editMode)" class="option-icon" />
      <span>{{ $t(editMode) }}</span>
      <div class="caret">
        <CaretSplittingOverview />
      </div>
      <span class="overview">{{ $t("overview") }}</span>
    </div>

    <b-dropdown v-else>
      <template #trigger>
        <a class="navbar-item option" role="button">
          <b-icon :icon="getIcon(editMode)" class="option-icon" />
          <span>{{ $t(editMode) }}</span>
          <div class="caret">
            <CaretDown />
          </div>
        </a>
      </template>
      <b-dropdown-item
        v-for="option of Object.values(editOptions)"
        :key="option"
        aria-role="listitem"
        class="option-item"
        @click="handleDropdownClick(option)"
        ><b-icon :icon="getIcon(option)" class="option-icon" />
        <span>{{ $t(option) }}</span>
        <b-icon
          icon="check"
          class="option-icon check"
          v-if="option === editMode"
        />
      </b-dropdown-item>
    </b-dropdown>
    <div class="buttons">
      <b-button
        :label="$t('cancel')"
        class="button-cancel"
        type="is-default"
        @click="handleCancel"
      />
      <b-button
        :label="
          editMode === editOptions.split ? handleSplitButton() : $t('submit')
        "
        type="is-primary"
        :disabled="false"
        @click="handleNext"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import CaretDown from "../../assets/images/TopBarCaretDownImg";
import CaretSplittingOverview from "../../assets/images/CaretSplittingOverview";

export default {
  name: "EditTopBar",
  components: {
    CaretDown,
    CaretSplittingOverview
  },
  computed: {
    ...mapState("edit", ["editMode", "editOptions", "splitPages"])
  },
  props: {
    splitOverview: {
      type: Boolean
    },
    handleCloseEditing: {
      type: Function
    }
  },
  methods: {
    getIcon(option) {
      if (option === this.editOptions.reorder) {
        return "repeat";
      } else if (option === this.editOptions.rotate) {
        return "arrow-rotate-left";
      } else if (option === this.editOptions.split) {
        return "scissors";
      } else {
        return "";
      }
    },
    handleDropdownClick(option) {
      this.$store.dispatch("edit/setEditMode", option);
    },
    handleSplitButton() {
      if (this.splitOverview) {
        return this.$i18n.t("save");
      }
      return this.$i18n.t("next");
    },
    handleNext() {
      if (this.editMode === this.editOptions.split) {
        // then next view
        if (this.splitOverview) {
          this.$store.dispatch("edit/editDocument", this.splitPages);
          this.handleCloseEditing();
        } else {
          this.$emit("confirm-splitting");
        }
      } else if (this.editMode === this.editOptions.rotate) {
        // handle submit
        this.$emit("submit-rotation");
      } else if (this.editMode === this.editOptions.reorder) {
        // handle submit
        this.$store.dispatch("edit/editDocument", this.splitPages);
        this.handleCloseEditing();
      }
    },
    handleCancel() {
      this.$emit("cancel-editing");
    }
  }
};
</script>
