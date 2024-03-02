<template>
  <div id="document-top-bar-component" ref="documentTopBar">
    <div
      v-if="selectedDocument && selectedDocument.pages.length > 0 && !loading"
      :class="['document-top-bar', editMode && 'edit-mode-top-bar']"
    >
      <div v-if="!recalculatingAnnotations" class="left-bar-components">
        <DocumentCategory
          v-if="categories && !editMode && !publicView && !isDocumentReviewed"
        />
      </div>

      <div
        :class="[
          'center-bar-components',
          recalculatingAnnotations && 'single-component',
        ]"
      >
        <div
          v-if="previousDocument"
          class="left-arrow navigation-arrow"
          type="button"
          @click="navigateToDocument(previousDocument)"
        >
          <b-icon icon="angle-left" size="is-small" />
        </div>

        <DocumentName :data-file-name="selectedDocument.data_file_name" />

        <div
          v-if="nextDocument"
          class="right-arrow navigation-arrow"
          type="button"
          @click="navigateToDocument(nextDocument)"
        >
          <b-icon icon="angle-right" size="is-small" />
        </div>
      </div>

      <div v-if="!recalculatingAnnotations" class="right-bar-components">
        <div
          v-if="!editMode && (!publicView || !isDocumentReviewed)"
          class="keyboard-actions-info"
        >
          <KeyboardActionsDescription />
        </div>

        <div
          v-if="!editMode && (publicView || isDocumentReviewed)"
          class="read-only-info"
        >
          <b-tooltip
            :animated="false"
            position="is-bottom"
            class="right-aligned width-184"
          >
            <span v-if="publicView">
              {{ $t("lite_mode") }}
            </span>
            <span v-else class="doc-reviewed">
              {{ $t("reviewed_mode") }}
            </span>
            <b-icon
              :class="[
                'info-icon is-small',
                !publicView && isDocumentReviewed && 'info-reviewed',
              ]"
              icon="circle-info"
            />
            <template #content>
              <div v-if="publicView" class="read-only-details">
                {{ $t("limited_functionalities") }}
              </div>
              <div v-else class="read-only-details">
                {{ $t("document_reviewed") }}
              </div>
            </template>
          </b-tooltip>
        </div>

        <div class="top-bar-buttons">
          <DocumentTopBarButtons />
        </div>
      </div>
    </div>
    <div v-else class="loading-top-bar">
      <b-skeleton position="is-centered" width="25%" height="60%" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import DocumentCategory from "../../components/DocumentCategory";
import DocumentName from "./DocumentName";
import DocumentTopBarButtons from "./DocumentTopBarButtons";
import KeyboardActionsDescription from "./KeyboardActionsDescription";

/**
 * This component has different functionalities
 * based on Dashboard View or Edit Mode
 */

export default {
  name: "DocumentTopBar",
  components: {
    DocumentCategory,
    DocumentName,
    DocumentTopBarButtons,
    KeyboardActionsDescription,
  },
  data() {
    return {
      categoryError: false,
      previousDocument: null,
      nextDocument: null,
    };
  },
  computed: {
    ...mapState("document", [
      "selectedDocument",
      "publicView",
      "loading",
      "recalculatingAnnotations",
    ]),
    ...mapState("display", ["reviewFilter"]),
    ...mapState("category", ["categories"]),
    ...mapState("edit", ["editMode"]),
    ...mapState("project", ["documentsInProject"]),
    ...mapGetters("document", [
      "isDocumentReviewed",
      "isDocumentReadyToBeReviewed",
      "waitingForSplittingConfirmation",
    ]),
  },
  watch: {
    documentsInProject(newValue) {
      if (newValue && this.selectedDocument) {
        this.getPreviousAndNextDocuments();
      }
    },
  },
  created() {
    window.addEventListener("resize", this.handleResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.handleResize);
  },
  mounted() {
    if (this.$refs.documentTopBar) {
      this.setComponentWidth(this.$refs.documentTopBar.offsetWidth);
    }
  },
  methods: {
    setComponentWidth(width) {
      // set width for the error messages to match the width
      // and avoid going over the Dashboard
      this.$store.dispatch("document/setErrorMessageWidth", width);
    },
    handleResize() {
      this.setComponentWidth(this.$refs.documentTopBar.offsetWidth);
    },
    getPreviousAndNextDocuments() {
      // Only consider documents who have a status of "ready"
      const filteredDocuments = this.documentsInProject.filter(
        (document) =>
          (this.reviewFilter && this.isDocumentReadyToBeReviewed(document)) ||
          this.waitingForSplittingConfirmation(document)
      );

      if (!filteredDocuments) return;

      const found = filteredDocuments.find(
        (document) => document.id === this.selectedDocument.id
      );

      const indexOfCurrentDocument = filteredDocuments.indexOf(found);

      if (!(indexOfCurrentDocument < 0)) {
        this.previousDocument = filteredDocuments[indexOfCurrentDocument - 1];
        this.nextDocument = filteredDocuments[indexOfCurrentDocument + 1];
      } else {
        this.previousDocument = filteredDocuments[0];
        this.nextDocument = filteredDocuments[1];
      }
    },
    navigateToDocument(document) {
      if (!document) return;

      this.$store.dispatch("document/changeCurrentDocument", document.id);

      if (this.editMode) {
        // Reset edit mode when changing the document,
        // in case the change was made from the arrows in the Edit Mode
        // so that the user does not get stuck in this interface
        this.$store.dispatch("edit/disableEditMode");
      }
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>
