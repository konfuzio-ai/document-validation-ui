<style scoped lang="scss" src="../../assets/scss/edit_top_bar.scss"></style>
<template>
  <div class="edit-top-bar">
    <b-dropdown>
      <template #trigger>
        <a class="navbar-item dropdown-option" role="button">
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
        :label="editMode === editOptions.split ? $t('next') : $t('submit')"
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

export default {
  name: "EditTopBar",
  components: {
    CaretDown
  },
  computed: {
    ...mapState("document", ["editMode", "editOptions"])
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
      this.$store.dispatch("document/setEditMode", option);
    },
    handleNext() {
      if (this.editMode === this.editOptions.split) {
        // then next view
      } else if (this.editMode === this.editOptions.rotate) {
        // handle submit
        console.log("rotation");
        this.$emit("submit-rotation");
      } else if (this.editMode === this.editOptions.reorder) {
        // handle submit
      }
    },
    handleCancel() {
      this.$emit("cancel-editing");
    }
  }
};
</script>
