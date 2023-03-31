<template>
  <div class="toolbar-container">
    <div :class="['toolbar', recalculatingAnnotations && 'hidden']">
      <b-tooltip
        :label="tooltipInfo"
        multilined
        :active="editModeDisabled"
        size="is-large"
        class="top-aligned"
      >
        <div
          v-if="!editMode && !publicView"
          :class="[
            'icons icons-left',
            editModeDisabled && 'edit-mode-disabled',
          ]"
          @click="handleEdit"
        >
          <div class="edit-icon icon">
            <EditDocIcon />
          </div>
          <span class="edit-text">{{ $t("edit") }}</span>
        </div>
      </b-tooltip>
      <div v-if="!editMode && !publicView" class="toolbar-divider" />
      <div class="icons icons-right">
        <div class="fit-zoom icon" @click.prevent.stop="fitAuto">
          <FitZoomIcon />
        </div>
        <div class="zoom-in icon" @click.prevent.stop="zoomIn">
          <PlusIcon />
        </div>
        <div class="zoom-out icon" @click.prevent.stop="zoomOut">
          <MinusIcon />
        </div>
        <div class="percentage">
          {{ `${currentPercentage}%` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import FitZoomIcon from "../../assets/images/FitZoomIcon";
import PlusIcon from "../../assets/images/PlusIcon";
import MinusIcon from "../../assets/images/MinusIcon";
import EditDocIcon from "../../assets/images/EditDocIcon";

export default {
  name: "DocumentToolbar",
  components: {
    FitZoomIcon,
    PlusIcon,
    MinusIcon,
    EditDocIcon,
  },
  data() {
    return {
      defaultScale: null,
      currentPercentage: 100,
      defaultPercentage: 0.25,
      fitPercentage: 0.5,
      toolbarModalOpen: true,
      editModeDisabled: false,
      tooltipInfo: null,
    };
  },
  computed: {
    ...mapState("display", ["scale"]),
    ...mapState("edit", ["editMode"]),
    ...mapState("document", [
      "selectedDocument",
      "recalculatingAnnotations",
      "publicView",
    ]),
    ...mapGetters("document", ["documentCannotBeEdited"]),
  },
  watch: {
    selectedDocument(newValue) {
      if (this.documentCannotBeEdited(newValue)) {
        this.editModeDisabled = true;
      }
    },
  },
  mounted() {
    this.defaultScale = this.scale;

    if (this.selectedDocument) {
      if (this.documentCannotBeEdited(this.selectedDocument)) {
        this.editModeDisabled = true;
      }
    }
  },
  updated() {
    if (this.selectedDocument.is_reviewed) {
      this.tooltipInfo = this.$t("document_reviewed");
    } else {
      this.tooltipInfo = this.$t("edit_not_available");
    }
  },
  methods: {
    handleEdit() {
      if (this.editModeDisabled) return;
      this.$store.dispatch("edit/enableEditMode");
    },
    zoomIn() {
      this.currentPercentage += this.defaultPercentage * 100;
      this.updateScale((this.defaultScale * this.currentPercentage) / 100);
    },
    zoomOut() {
      if (this.currentPercentage === 25) {
        return;
      }

      this.currentPercentage -= this.defaultPercentage * 100;
      this.updateScale((this.defaultScale * this.currentPercentage) / 100);
    },
    fitAuto() {
      if (this.currentPercentage === 50 || !this.defaultScale) return;

      // Always set to 50%
      this.updateScale(this.defaultScale * this.fitPercentage);

      this.currentPercentage = this.fitPercentage * 100;
    },
    updateScale(scale) {
      this.$store.dispatch("display/updateFit", "custom").then(() => {
        this.$store.dispatch("display/updateScale", { scale });
      });
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>
