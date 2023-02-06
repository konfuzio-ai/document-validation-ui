<template>
  <div :class="['document-edit', splitOverview && 'split-overview-component']">
    <div v-if="!splitOverview" class="pages-section">
      <EditPages
        :active-splitting-lines="activeSplittingLines"
        @change-page="changePage"
        @handle-splitting-lines="handleSplittingLines"
        @check-move="checkMove"
        @handle-drag-end="handleDragEnd"
      />
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
      />
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import EditSidebar from "./EditSidebar";
import SplitOverview from "./SplitOverview";
import EditPages from "./EditPages";

/**
 * This component shows a document thumbnail grid view and sidebar, to be able to edit the document.
 */
export default {
  name: "DocumentEdit",
  components: {
    EditSidebar,
    SplitOverview,
    EditPages,
  },
  data() {
    return {
      fileName: [],
      fileExtension: null,
      activeSplittingLines: [],
      dragging: false,
      prevPageAtIndex: null,
    };
  },
  computed: {
    ...mapState("document", ["recalculatingAnnotations", "selectedDocument"]),
    ...mapState("display", ["currentPage"]),
    ...mapState("edit", [
      "editMode",
      "documentPagesListForEditMode",
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
    documentPagesListForEditMode(newValue) {
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
      // set array of pages only with the data we need
      const pages = this.createDocumentPagesListForEditMode();
      this.$store.dispatch("edit/setDocumentPagesListForEditMode", pages);
      // create array to handle the splitting
      // length - 1 because of how many lines to split we need (last one not necessary)
      this.activeSplittingLines = new Array(
        this.selectedDocument.pages.length - 1
      );
    },
    createDocumentPagesListForEditMode() {
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
    splitFileNameFromExtension() {
      if (!this.selectedDocument) return;

      // Save the file name and the extension in different variables
      // to be used in the next step of the splitting

      if (this.selectedDocument.data_file_name) {
        this.fileName = this.selectedDocument.data_file_name
          .split(".")
          .slice(0, -1)
          .join(".");
      }

      if (this.selectedDocument.data_file_name) {
        this.fileExtension = this.selectedDocument.data_file_name
          .split(".")
          .at(-1);
      }
    },
    handleSplittingLines(page) {
      // For splitting line purposes
      // Add page number to specific index
      // Or replace it with 0 (to keep the same index) if it exists
      const found = this.activeSplittingLines.find(
        (item) => item === page.number
      );

      if (found) {
        this.activeSplittingLines.splice(page.number - 1, 1, 0);
      } else {
        this.activeSplittingLines.splice(page.number - 1, 1, page.number);
      }

      this.saveUpdatedDocument();
    },
    saveUpdatedDocument() {
      this.splitFileNameFromExtension();

      // Check how many sub docs we have
      const subDocuments = this.activeSplittingLines.filter(
        (item) => item !== 0
      );

      // Create array of objects
      // with a fixed size based on how many sub documents are currently
      const pageObjectArray = new Array(subDocuments.length + 1);

      // Loop over the created array
      // for each iteration we create the page object with the correponding data
      for (let i = 0; i < pageObjectArray.length; i++) {
        const pageObject = {
          name: this.handleFileName(i),
          category: this.selectedDocument.category,
          pages: this.handleSubPages(i, subDocuments),
        };

        // Then we replace the "undefined" with the created object
        pageObjectArray.splice(i, 1, pageObject);
      }

      // Set the state to the created array
      this.$store.dispatch("edit/setUpdatedDocument", pageObjectArray);
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
    handleSubPages(index, splittingLine) {
      // assign the correct pages to each object
      let pages;

      if (index === 0) {
        pages = this.documentPagesListForEditMode.slice(
          0,
          splittingLine[index]
        );
      } else {
        if (!splittingLine[index]) {
          pages = this.documentPagesListForEditMode.slice(
            splittingLine[index - 1]
          );
        } else {
          pages = this.documentPagesListForEditMode.slice(
            splittingLine[index - 1],
            splittingLine[index]
          );
        }
      }
      return pages;
    },

    /** SORT */
    checkMove(e) {
      // Save the page placed originally where the page we are dragging will go
      this.prevPageAtIndex = this.documentPagesListForEditMode.find(
        (page) =>
          this.documentPagesListForEditMode.indexOf(page) ===
          e.draggedContext.futureIndex
      );
    },
    handleDragEnd() {
      // Update page numbers
      const pages = this.documentPagesListForEditMode.map((page) => {
        const index = this.documentPagesListForEditMode.indexOf(page);
        return {
          ...page,
          number: index + 1,
        };
      });

      this.$store.dispatch("edit/setDocumentPagesListForEditMode", pages);
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
