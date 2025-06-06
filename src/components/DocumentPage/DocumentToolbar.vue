<template>
  <div id="toolbar-container">
    <div :class="['toolbar', recalculatingAnnotations && 'hidden']">
      <b-tooltip
        :label="tooltipInfo"
        multilined
        :active="editModeDisabled"
        size="is-large"
        class="top-aligned"
      >
        <div
          v-if="isEditModeAvailable"
          id="edit-mode-button"
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
      <div v-if="isEditModeAvailable" class="toolbar-divider" />
      <div
        v-if="!publicView && !editMode"
        class="search-document icons"
        @click="toggleSearch"
      >
        <b-icon icon="search" size="is-small" class="search-icon" />
      </div>

      <div v-if="!publicView" class="download-file icons">
        <b-dropdown aria-role="list" position="is-top-right" scrollable>
          <template #trigger>
            <b-icon icon="download" size="is-small" class="download-file" />
          </template>

          <b-dropdown-item
            class="original-file"
            aria-role="listitem"
            @click="handleDownloadFile()"
            >{{ $t("original_file") }}</b-dropdown-item
          >
          <b-dropdown-item
            class="ocr-file"
            aria-role="listitem"
            @click="handleDownloadFile('ocr')"
            >{{ $t("pdf_file") }}</b-dropdown-item
          >
        </b-dropdown>
      </div>

      <div v-if="!publicView" class="toolbar-divider" />

      <div class="icons icons-right">
        <div
          :class="[
            'fit-zoom',
            'icon',
            currentPercentage === 50 && 'zoom-disabled',
          ]"
          @click.prevent.stop="fitAuto"
        >
          <FitZoomIcon />
        </div>
        <div
          :class="['zoom-in icon', isZoomInExceeding && 'zoom-disabled']"
          @click.prevent.stop="zoomIn"
        >
          <PlusIcon />
        </div>
        <div
          :class="['zoom-out icon', isZoomOutExceeding && 'zoom-disabled']"
          @click.prevent.stop="zoomOut"
        >
          <MinusIcon />
        </div>
        <div id="zoom-percentage" class="percentage">
          {{ `${currentPercentage}%` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from "vuex";
import FitZoomIcon from "../../assets/images/FitZoomIcon";
import PlusIcon from "../../assets/images/PlusIcon";
import MinusIcon from "../../assets/images/MinusIcon";
import EditDocIcon from "../../assets/images/EditDocIcon";
import api from "../../api";

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
      currentPercentage: 100,
      fitWidthScale: 1, // baseline for 100%
      maxPercentage: 500,
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
    ...mapGetters("edit", ["isEditModeAvailable"]),
    ...mapState("document", [
      "selectedDocument",
      "recalculatingAnnotations",
      "publicView",
    ]),
    ...mapGetters("document", ["documentCannotBeEdited"]),
    isZoomInExceeding() {
      return this.currentPercentage === this.maxPercentage;
    },
    isZoomOutExceeding() {
      return this.currentPercentage === this.defaultPercentage * 100;
    },
  },
  watch: {
    selectedDocument(newValue) {
      if (this.documentCannotBeEdited(newValue)) {
        this.editModeDisabled = true;
      }
    },
    scale(newScale) {
      if (this.fitWidthScale > 0) {
        this.currentPercentage = Math.round((newScale / this.fitWidthScale) * 100);
      } else {
        this.currentPercentage = Math.round(newScale * 100);
      }
    },
  },
  mounted() {
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
    ...mapActions("display", ["toggleSearch"]),
    handleEdit() {
      if (this.editModeDisabled) return;
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("edit/enableEditMode");
    },
    zoomIn() {
      if (this.currentPercentage === this.maxPercentage) return;

      // exit edit mode of Annotation if changing zoom during editing
      this.cancelAnnotationEditMode();
      this.currentPercentage += this.defaultPercentage * 100;
      this.updateScale(this.scale + this.defaultPercentage);
    },
    zoomOut() {
      if (this.currentPercentage === this.defaultPercentage * 100) {
        return;
      }

      // exit edit mode of Annotation if changing zoom during editing
      this.cancelAnnotationEditMode();

      this.currentPercentage -= this.defaultPercentage * 100;
      this.updateScale(this.scale - this.defaultPercentage);
    },
    fitAuto() {
      this.cancelAnnotationEditMode();
      this.$store.dispatch("display/updateFit", "all").then(() => {
        this.$nextTick(() => {
          this.fitWidthScale = this.scale;
          this.currentPercentage = 100;
        });
      });
    },
    updateScale(scale) {
      this.$store.dispatch("display/updateFit", "custom").then(() => {
        this.$store.dispatch("display/updateScale", { scale });
      });
    },
    handleDownloadFile(fileType) {
      let fileUrl;
      // get the file name without the extension
      let fileName = this.selectedDocument.data_file_name;

      if (fileType === "ocr") {
        fileUrl = this.selectedDocument.file_url;
        fileName = `${fileType}_${fileName}`;
      } else {
        fileUrl = `/doc/show-original/${this.selectedDocument.id}/`;
      }

      // Automatically download original or ocr files
      return api
        .makeFileRequest(fileUrl)
        .then((myBlob) => {
          const url = URL.createObjectURL(myBlob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", fileName);
          link.click();
          URL.revokeObjectURL(link.href);
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("error_downloading_file"),
          });
          console.log(error);
        });
    },
    cancelAnnotationEditMode() {
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>
