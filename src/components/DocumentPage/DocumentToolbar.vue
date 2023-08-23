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
          v-if="!editMode && !publicView && !isDocumentReviewed"
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
      <div
        v-if="!editMode && !publicView && !isDocumentReviewed"
        class="toolbar-divider"
      />

      <div v-if="!editMode && !publicView" class="download-file icons">
        <b-dropdown aria-role="list" position="is-top-right">
          <template #trigger>
            <b-icon icon="download" size="is-small" />
          </template>

          <b-dropdown-item
            aria-role="listitem"
            @click="handleDownloadFile('original')"
            >Original file</b-dropdown-item
          >
          <b-dropdown-item
            aria-role="listitem"
            @click="handleDownloadFile('pdf')"
            >PDF file</b-dropdown-item
          >
        </b-dropdown>
      </div>

      <div v-if="!editMode && !publicView" class="toolbar-divider" />

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
          :class="['zoom-in', 'icon', isZoomInExceeding && 'zoom-disabled']"
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
    ...mapState("document", [
      "selectedDocument",
      "recalculatingAnnotations",
      "publicView",
    ]),
    ...mapGetters("document", ["documentCannotBeEdited", "isDocumentReviewed"]),
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
      // exit edit mode of Annotation if changing zoom during editing
      this.cancelAnnotationEditMode();

      // Always set to 50%
      this.currentPercentage = 50;
      this.$store.dispatch("display/updateFit", "all");
    },
    updateScale(scale) {
      this.$store.dispatch("display/updateFit", "custom").then(() => {
        this.$store.dispatch("display/updateScale", { scale });
      });
    },
    handleDownloadFile(fileType) {
      let imageUrl;
      const downloadTitle = this.selectedDocument.data_file_name;

      if (fileType === "pdf") {
        imageUrl = this.selectedDocument.file_url;
      } else {
        imageUrl = `/doc/show-original/${this.selectedDocument.id}/`;
      }

      return api
        .makeImageRequest(imageUrl)
        .then((myBlob) => {
          console.log(myBlob);
          const url = window.URL.createObjectURL(myBlob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("target", "_blank");
          document.body.appendChild(link);
          link.click();
        })
        .catch((error) => {
          // TODO: show error message
          console.log(error);
        });
    },
    cancelAnnotationEditMode() {
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("selection/setSelectedEntities", null);
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_toolbar.scss"></style>
