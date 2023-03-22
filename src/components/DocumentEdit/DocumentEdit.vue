<template>
  <div :class="['document-edit', splitOverview && 'split-overview-component']">
    <div v-if="!splitOverview" class="pages-section">
      <EditPages
        :active-splitting-lines="activeSplittingLines"
        :split-suggestions-enabled="splitSuggestionsEnabled"
        @change-page="changePage"
        @handle-splitting-lines="handleSplittingLines"
        @check-move="checkMove"
        @handle-drag-end="handleDragEnd"
      />
      <div class="info-bar">
        <SplitInfoBar v-if="splitSuggestionsEnabled" />
      </div>
    </div>
    <div v-else class="split-overview-section">
      <SplitOverview
        :file-name="fileName"
        :file-extension="fileExtension"
        @change-page="changePage"
      />
    </div>
    <div v-if="!splitOverview" class="sidebar">
      <EditSidebar
        @rotate-left="rotatePage"
        @rotate-right="rotatePage"
        @rotate-all-left="handleRotationsToTheLeft"
        @rotate-all-right="handleRotationsToTheRight"
        @handle-splitting-suggestions="applySplittingSuggestions"
        :split-suggestions-enabled="splitSuggestionsEnabled"
      />
    </div>
    <div class="confirmation-modal-container">
      <EditConfirmationModal @save-changes="saveEditChanges" />
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import EditSidebar from "./EditSidebar";
import SplitOverview from "./SplitOverview";
import EditPages from "./EditPages";
import SplitInfoBar from "./SplitInfoBar";
import EditConfirmationModal from "./EditConfirmationModal";

/**
 * This component shows a document thumbnail grid view and sidebar, to be able to edit the document.
 */
export default {
  name: "DocumentEdit",
  components: {
    EditSidebar,
    SplitOverview,
    EditPages,
    SplitInfoBar,
    EditConfirmationModal,
  },
  data() {
    return {
      fileName: null,
      fileExtension: null,
      activeSplittingLines: [],
      dragging: false,
      prevPageAtIndex: null,
      splitSuggestionsEnabled: false,
    };
  },
  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "selectedDocument",
      "splittingSuggestions",
    ]),
    ...mapState("display", ["currentPage"]),
    ...mapState("edit", [
      "editMode",
      "pagesForPostprocess",
      "updatedDocument",
      "splitOverview",
      "selectedPages",
    ]),
  },
  watch: {
    pages() {
      if (!this.selectedDocument) return;

      this.setPages();
    },
    splitOverview(newValue) {
      if (newValue) {
        this.splitFileNameFromExtension();
      }
    },
    pagesForPostprocess(newValue) {
      if (newValue) {
        this.saveUpdatedDocument();
      }
    },
  },
  mounted() {
    this.setPages();
  },
  methods: {
    setPages() {
      if (!this.selectedDocument) {
        return;
      }

      // set array of pages only with the data we need for postprocessing the document
      this.$store.dispatch(
        "edit/setPagesForPostprocess",
        this.createPagesForPostprocess()
      );

      // Create array with placeholder data for the splitting points
      this.selectedDocument.pages.map((page) => {
        if (page.number === this.selectedDocument.pages.length) {
          this.setSplittingArray(page.number, null);
          return;
        }
        this.setSplittingArray(0, null);
      });

      if (this.splittingSuggestions) {
        this.splitSuggestionsEnabled = true;
        this.setAutomaticSplitting();
      }
    },
    createPagesForPostprocess() {
      return this.selectedDocument.pages.map((page) => {
        return {
          id: page.id,
          angle: 0,
          number: page.number,
          thumbnail_url: page.thumbnail_url,
          image_url: page.image_url,
          size: page.size,
          updated_at: this.selectedDocument.downloaded_at,
        };
      });
    },
    changePage(pageNumber) {
      // This will scroll to the clicked page
      if (pageNumber != this.currentPage) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    },

    /** ROTATE */
    rotatePage(direction) {
      const page = this.selectedPages.map((page) => {
        return page;
      });

      this.$store.dispatch("edit/rotatePage", {
        page,
        direction,
      });
    },
    handleRotationsToTheLeft() {
      this.$store.dispatch("edit/updateRotationToTheLeft");
    },
    handleRotationsToTheRight() {
      this.$store.dispatch("edit/updateRotationToTheRight");
    },

    /** SPLIT */
    setAutomaticSplitting() {
      // map over splitting suggestions to find the page number based on the page id
      // to update the activeSplittingLines array with this data
      this.splittingSuggestions.map((item, index) => {
        const firstPage = this.selectedDocument.pages.find(
          (page) => page.id === item.pages[0].id
        );

        this.handleSplittingLines(firstPage.number, "AI");
      });
    },
    applySplittingSuggestions(value) {
      // Show information bar
      this.splitSuggestionsEnabled = value;

      // Apply or remove split lines
      this.setAutomaticSplitting();
    },
    setSplittingArray(pageNumber, splittingOrigin) {
      // This function sets the activeSplittingLines array
      // based on splitting suggestions or no suggestions
      this.activeSplittingLines.push({
        page: pageNumber,
        origin: splittingOrigin,
      });
    },
    splitFileNameFromExtension() {
      if (!this.selectedDocument && !this.selectedDocument.data_file_name)
        return;

      // Save the file name and the extension in different variables
      // to be used in the next step of the splitting
      this.fileName = this.selectedDocument.data_file_name
        .split(".")
        .slice(0, -1)
        .join(".");

      this.fileExtension = this.selectedDocument.data_file_name
        .split(".")
        .at(-1);
    },
    handleSplittingLines(page, origin) {
      console.log(this.splitSuggestionsEnabled);
      // To select and deselect the division lines
      // Add page number & origin to specific index
      // Or replace it with 0 (to keep the same index & array length) if it exists

      const found = this.activeSplittingLines.find(
        (item) => item.page === page
      );

      // new line added or removed based on the page number:
      const newPage = { page: page, origin: origin };
      const removedPage = { page: 0, origin: null };

      // the last line, not visible in the UI, should always remain
      // for consistency in number of new documents
      if (page === this.activeSplittingLines.length) {
        return;
      } else if (found) {
        this.activeSplittingLines.splice(page - 1, 1, removedPage);
      } else {
        this.activeSplittingLines.splice(page - 1, 1, newPage);
      }

      this.saveUpdatedDocument();
    },
    saveUpdatedDocument() {
      this.splitFileNameFromExtension();

      const newDocuments = this.createEachNewDocument(
        this.activeSplittingLines,
        this.activeSplittingLines.length
      );

      // // Set the state to the created array
      this.$store.dispatch("edit/setUpdatedDocument", newDocuments);
    },
    createEachNewDocument(clickedLines, length) {
      const documents = new Array(length);

      for (let i = 0; i < length; i++) {
        const pageObject = {
          name: this.handleFileName(i),
          category: this.handleDocumentCategory(i, clickedLines),
          pages: this.handleSubPages(i, clickedLines),
        };

        // we replace the "undefined" with the created object
        documents.splice(i, 1, pageObject);
      }

      return documents;
    },
    handleFileName(index) {
      let newFileName;

      // Return original file name,
      // file name + copy,
      // or file name + copy + number
      // based on where the object will be located in the array
      if (index === 0) {
        newFileName = this.selectedDocument.data_file_name;
      } else if (index === 1) {
        newFileName = `${this.fileName}_copy.${this.fileExtension}`;
      } else {
        newFileName = `${this.fileName}_copy${index}.${this.fileExtension}`;
      }
      return newFileName;
    },
    handleDocumentCategory(index, clicledLines) {
      if (clicledLines[index].origin && clicledLines[index].origin === "AI") {
        const page = clicledLines[index].page;
        return this.splittingSuggestions[page - 1].category;
      } else {
        return this.selectedDocument.category;
      }
    },
    handleSubPages(index, clickedLines) {
      // assign the correct pages to each object
      let pages;

      if (index === 0) {
        pages = this.pagesForPostprocess.slice(0, clickedLines[index].page);
      } else {
        if (!clickedLines[index].page) {
          pages = this.pagesForPostprocess.slice(clickedLines[index - 1].page);
        } else {
          pages = this.pagesForPostprocess.slice(
            clickedLines[index - 1].page,
            clickedLines[index].page
          );
        }
      }

      return pages;
    },

    /** SORT */
    checkMove(e) {
      // Save the page placed originally where the page we are dragging will go
      this.prevPageAtIndex = this.pagesForPostprocess.find(
        (page) =>
          this.pagesForPostprocess.indexOf(page) ===
          e.draggedContext.futureIndex
      );
    },
    handleDragEnd() {
      // Update page numbers
      const pages = this.pagesForPostprocess.map((page) => {
        const index = this.pagesForPostprocess.indexOf(page);
        return {
          ...page,
          number: index + 1,
        };
      });

      this.$store.dispatch("edit/setPagesForPostprocess", pages);
    },

    /** SUBMIT CHANGES */
    // Send update request to the backend
    saveEditChanges() {
      this.$store
        .dispatch("edit/editDocument", this.updatedDocument)
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        });

      this.closeEditMode();
    },

    closeEditMode() {
      this.$store.dispatch("edit/disableEditMode");
      this.$store.dispatch("edit/setSplitOverview", false);
      this.$store.dispatch("edit/setUpdatedDocument", null);
      this.$store.dispatch("edit/setSelectedPages", null);
      this.$nextTick(() => {
        // reset to first page
        this.$store.dispatch("display/updateCurrentPage", 1);
      });
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
