<template>
  <div :class="['document-edit', splitOverview && 'split-overview-component']">
    <div v-if="!splitOverview" class="pages-section">
      <EditPages
        :splitting-lines="splittingLines"
        :split-suggestions-enabled="splitSuggestionsEnabled"
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
        :split-suggestions-enabled="splitSuggestionsEnabled"
        @rotate-left="rotatePage"
        @rotate-right="rotatePage"
        @rotate-all-left="handleRotationsToTheLeft"
        @rotate-all-right="handleRotationsToTheRight"
        @handle-splitting-suggestions="applySplittingSuggestions"
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
      splittingLines: [],
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
        this.saveUpdatedDocuments();
      }
    },
    splittingLines(newValue) {
      const aiSplit = newValue.find((item) => item.origin === "AI");

      // If there are no AI suggestions left, because of being manually removed by the user
      // the Smart Split switch should be turned off
      if (!aiSplit) {
        this.splitSuggestionsEnabled = false;
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
      if (this.selectedDocument.pages.length > 0) {
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
      // to update the splittingLines array with this data
      if (!this.splittingSuggestions) return;

      this.splittingSuggestions.map((item) => {
        const firstPage = this.selectedDocument.pages.find(
          (page) => page.id === item.pages[0].id
        );

        if (firstPage.number === 1 && item.pages.length > 1) {
          // only add the active splitting line from the 1st page of the second document
          // since it's the first splitting point
          return;
        }

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
      // This function sets the splittingLines array
      // based on splitting suggestions or no suggestions
      this.splittingLines.push({
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
      // To select and deselect the division lines
      // Add page number & origin to specific index
      // Or replace it with 0 (to keep the same index & array length) if it exists
      const found = this.splittingLines.find((item) => item.page === page);

      // new line added or removed based on the page clicked:
      const newPage = { page: page, origin: origin };
      const removedPage = { page: 0, origin: origin };

      if (
        page === this.splittingLines.length ||
        (!this.splitSuggestionsEnabled && !found && origin === "AI")
      ) {
        // check if it's the last item to keep unchanged
        // Or if splitting is switched off, but some of the suggestion lines
        // were removed manually
        return;
      } else if (this.splitSuggestionsEnabled && origin === "AI") {
        // if manual suggestions were added but we enable automatic splitting,
        // this last one takes over
        this.splittingLines.splice(page - 1, 1, newPage);
      } else if (found) {
        // If splitting is switched off and we have manual splits,
        // those should stay unchanged
        if (!this.splitSuggestionsEnabled && found.origin !== origin) {
          return;
        }

        this.splittingLines.splice(page - 1, 1, removedPage);
      } else {
        this.splittingLines.splice(page - 1, 1, newPage);
      }

      this.saveUpdatedDocuments();
    },
    saveUpdatedDocuments() {
      this.splitFileNameFromExtension();

      const clickedLines = this.splittingLines.filter(
        (item) => item.page !== 0
      );

      const newDocuments = this.createEachNewDocument(
        clickedLines,
        clickedLines.length
      );

      // // Set the state to the created array
      this.$store.dispatch("edit/setUpdatedDocument", newDocuments);
    },
    createEachNewDocument(clickedLines, length) {
      const documents = new Array(length);

      for (let i = 0; i < length; i++) {
        const newDocument = {
          name: this.handleNewDocumentName(i),
          category: this.handleNewDocumentCategory(i, clickedLines),
          pages: this.handleNewDocumentPages(i, clickedLines),
        };

        // we replace the "undefined" with the created object
        documents.splice(i, 1, newDocument);
      }

      return documents;
    },
    handleNewDocumentName(index) {
      let newFileName;

      if (index === 0) {
        newFileName = this.selectedDocument.data_file_name;
      } else if (index === 1) {
        newFileName = `${this.fileName}_copy.${this.fileExtension}`;
      } else {
        newFileName = `${this.fileName}_copy${index}.${this.fileExtension}`;
      }
      return newFileName;
    },
    handleNewDocumentCategory(index, clickedLines) {
      if (clickedLines[index].origin && clickedLines[index].origin === "AI") {
        // get the index of the new document in the splitting suggestions
        // to return its category
        const i = this.indexOfSplittingSuggestion(index, clickedLines);

        return this.splittingSuggestions[i].category;
      } else {
        return this.selectedDocument.category;
      }
    },
    handleNewDocumentPages(index, clickedLines) {
      // assign the correct pages to each new document
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
    indexOfSplittingSuggestion(index, clickedLines) {
      const foundPage = this.selectedDocument.pages.find(
        (page) => page.number === clickedLines[index].page
      );

      const singleSplittingSuggestion = this.splittingSuggestions.find(
        (item) => item.pages[0].id === foundPage.id
      );

      return this.splittingSuggestions.indexOf(singleSplittingSuggestion);
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
