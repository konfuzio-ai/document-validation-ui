<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
<template>
  <div :class="['document-edit', splitOverview && 'split-overview-component']">
    <div class="pages-section" v-if="!splitOverview">
      <EditPages
        :activeSplittingLines="activeSplittingLines"
        :scroll="scroll"
        @change-page="changePage"
        @handle-splitting-lines="handleSplittingLines"
        @check-move="checkMove"
        @handle-drag-end="handleDragEnd"
      />
    </div>
    <div v-else class="split-overview-section">
      <SplitOverview
        :fileName="fileName"
        :fileExtension="fileExtension"
        :handleShowError="handleShowError"
        :handleMessage="handleMessage"
        @change-page="changePage"
      />
    </div>
    <div class="sidebar" v-if="!splitOverview">
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
    EditPages
  },
  data() {
    return {
      fileName: [],
      fileExtension: null,
      scroll: false,
      activeSplittingLines: [],
      dragging: false,
      prevPageAtIndex: null
    };
  },
  props: {
    showEditView: {
      type: Boolean
    }
  },
  computed: {
    ...mapState("document", [
      "pages",
      "recalculatingAnnotations",
      "selectedDocument"
    ]),
    ...mapState("display", ["currentPage"]),
    ...mapState("edit", [
      "editMode",
      "pagesArray",
      "updatedDocument",
      "splitOverview",
      "pagesFrontend",
      "selectedPages"
    ])
  },
  methods: {
    setPages() {
      if (!this.selectedDocument) {
        return;
      }

      if (
        this.pages.length &&
        this.pages.length === this.selectedDocument.number_of_pages
      ) {
        // set array of pages only with the data we need
        this.$store.dispatch("edit/setPagesArray", this.createPagesArray());
        this.$store.dispatch("edit/setPagesFrontend", this.createPagesArray());
        // create array to handle the splitting
        // length - 1 because of how many lines to split we need (last one not necessary)
        this.activeSplittingLines = new Array(this.pages.length - 1);
      }
    },
    createPagesArray() {
      return this.pages.map(page => {
        return {
          id: page.id,
          angle: 0,
          page_number: page.number,
          thumbnail_url: page.thumbnail_url,
          updated_at: page.updated_at,
          image_url: page.image_url,
          size: page.size
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

    closeEditMode() {
      this.$store.dispatch("edit/disableEditMode").then(() => {
        this.$store.dispatch("display/updateFit", "width");
      });

      // Reset the rotation angles to 0 if rotation changes are cancelled
      if (this.pagesFrontend) {
        this.$store.dispatch("edit/setPagesFrontend", this.createPagesArray());
        this.$store.dispatch("edit/setPagesArray", this.createPagesArray());
      }

      this.$store.dispatch("edit/setUpdatedDocument", null);
      this.$store.dispatch("edit/setSelectedPages", null);
    },
    handleShowError() {
      this.$emit("handle-error", true);
    },
    handleMessage(message) {
      this.$emit("handle-message", message);
    },

    /** ROTATE */
    rotatePage(direction) {
      const page = this.selectedPages.map(page => {
        return page;
      });

      this.$store.dispatch("edit/rotatePage", {
        page,
        direction
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
        item => item === page.page_number
      );

      if (found) {
        this.activeSplittingLines.splice(page.page_number - 1, 1, 0);
      } else {
        this.activeSplittingLines.splice(
          page.page_number - 1,
          1,
          page.page_number
        );
      }

      this.saveUpdatedDocument();
    },
    saveUpdatedDocument() {
      this.splitFileNameFromExtension();

      // Check how many sub docs we have
      const subDocuments = this.activeSplittingLines.filter(item => item !== 0);

      // Create array of objects
      // with a fixed size based on how many sub documents are currently
      const pageObjectArray = new Array(subDocuments.length + 1);

      // Loop over the created array
      // for each iteration we create the page object with the correponding data
      for (let i = 0; i < pageObjectArray.length; i++) {
        const pageObject = {
          name: this.handleFileName(i),
          category: this.selectedDocument.category,
          pages: this.handleSubPages(i, subDocuments)
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
        pages = this.pagesArray.slice(0, splittingLine[index]);
      } else {
        if (!splittingLine[index]) {
          pages = this.pagesArray.slice(splittingLine[index - 1]);
        } else {
          pages = this.pagesArray.slice(
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
      this.prevPageAtIndex = this.pagesArray.find(
        page => this.pagesArray.indexOf(page) === e.draggedContext.futureIndex
      );
    },
    handleDragEnd() {
      // Update page numbers
      const pages = this.pagesArray.map(page => {
        const index = this.pagesArray.indexOf(page);
        return {
          ...page,
          page_number: index + 1
        };
      });

      this.$store.dispatch("edit/setPagesArray", pages);
      this.$store.dispatch("edit/setPagesFrontend", pages);
    }

    // resize(event) {
    //   console.log("event", event.x);
    //   const divX = this.divPosition - event.x;
    //   this.divPosition = event.x;

    //   while (this.resizing && this.width < 100) {
    //     this.width += 1;
    //   }
    // },
    // handleMouseDown(event) {
    //   if (event.offsetX < this.borderSize) {
    //     this.resizing = true;
    //     this.divPosition = event.x;

    //     document.addEventListener("mousemove", this.resize, false);
    //   }
    // },
    // handleMouseUp() {
    //   this.resizing = false;
    //   document.removeEventListener("mousemove", this.resize, false);
    // }
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
    pagesArray(newValue) {
      if (newValue) {
        this.saveUpdatedDocument();
      }
    }
  },
  mounted() {
    this.setPages();
  }
};
</script>
