<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
<template>
  <div :class="['document-edit', splitOverview && 'split-overview-component']">
    <EditTopBar
      :splitOverview="splitOverview"
      @cancel-editing="handleCloseEditing"
      @submit-rotation="handleRotationSubmission"
      @confirm-splitting="handleSplitOverview"
      :handleCloseEditing="handleCloseEditing"
    />
    <div class="pages-section" v-if="!splitOverview">
      <div :class="[scroll && 'scroll']">
        <draggable
          v-model="pagesArray"
          :class="['document-grid']"
          easing="cubic-bezier(0.37, 0, 0.63, 1)"
          @start="dragging = true"
          @end="handleEnd"
          :move="checkMove"
        >
          <div
            v-for="(page, index) in pagesArray"
            :key="page.id"
            :class="['image-section']"
          >
            <div class="image-container" @click="changePage(page.number)">
              <div class="thumbnail">
                <div
                  class="img-container"
                  :style="
                    editMode === 'rotate' && {
                      transform: 'rotate(' + getRotation(page.id) + 'deg)'
                    }
                  "
                >
                  <ServerImage
                    :class="['img-thumbnail']"
                    :imageUrl="`${page.thumbnail_url}?${page.updated_at}`"
                  />
                </div>
                <div class="icon-container">
                  <div class="action-icon">
                    <b-icon
                      icon="eye"
                      class="is-small"
                      @click="changePage(page.number)"
                    />
                  </div>
                  <div
                    class="action-icon"
                    v-if="editMode === editOptions.rotate"
                    @click="rotateSinglePage(page.id, page.number)"
                  >
                    <b-icon icon="arrow-rotate-left" class="is-small" />
                  </div>
                </div>
              </div>
              <span class="page-number">{{ page.number }}</span>
            </div>
            <div
              v-if="editMode === editOptions.split"
              :class="[
                'splitting-lines',
                activeSplittingLines[index] === page.number && 'active-split'
              ]"
              @click="handleSplittingLines(page)"
            >
              <div class="scissors-icon">
                <b-icon icon="scissors" class="is-small" />
              </div>
              <div v-if="activeSplittingLines[index] === page.number">
                <SplitDivider />
              </div>
            </div>
          </div>
        </draggable>
      </div>
    </div>
    <div v-else class="confirm-split-component">
      <SplitOverview
        :fileName="fileName"
        :fileExtension="fileExtension"
        :handleShowError="handleShowError"
        :handleMessage="handleMessage"
        :pagesArray="pagesArray"
        @change-page="changePage"
        @go-back="closeSplitOverview = true"
      />
    </div>
    <div class="footer">
      <EditFooter
        v-if="editMode === 'rotate'"
        @rotate-left="handleRotationToTheLeft"
        @rotate-right="handleRotationToTheRight"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import EditTopBar from "./EditTopBar";
import EditFooter from "./EditFooter";
import SplitOverview from "./SplitOverview";
import ServerImage from "../../assets/images/ServerImage";
import SplitDivider from "../../assets/images/SplitDivider";
import draggable from "vuedraggable";

/**
 * This component shows a document thumbnail grid view to be able to edit the document.
 */
export default {
  name: "DocumentEdit",
  components: {
    EditTopBar,
    EditFooter,
    SplitOverview,
    ServerImage,
    SplitDivider,
    draggable
  },
  data() {
    return {
      fileName: [],
      fileExtension: null,
      scroll: false,
      splitOverview: false,
      closeSplitOverview: false,
      activeSplittingLines: [],
      pagesArray: [],
      dragging: false,
      prevPageAtIndex: null
    };
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
      "editOptions",
      "rotations",
      "rotationsForBackend",
      "splitPages"
    ])
  },
  methods: {
    /** USED BY ALL EDIT MODES */
    setPages() {
      if (!this.selectedDocument) {
        return;
      }

      if (
        this.pages.length &&
        this.pages.length === this.selectedDocument.number_of_pages
      ) {
        /** Rotations */
        this.$store.dispatch("edit/setRotations", this.createRotations());
        this.$store.dispatch(
          "edit/setRotationsForBackend",
          this.createRotations()
        );

        /** Splitting */
        this.pages.map(page => {
          this.pagesArray.push({
            id: page.id,
            number: page.number,
            thumbnail_url: page.thumbnail_url,
            updated_at: page.updated_at
          });
        });

        this.activeSplittingLines = new Array(this.pages.length - 1);
      }
    },
    changePage(pageNumber) {
      if (pageNumber != this.currentPage) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    },
    handleCloseEditing() {
      this.$store.dispatch("edit/disableEditMode").then(() => {
        this.$store.dispatch("display/updateFit", "width");
      });

      // Reset the rotation angles to 0 if rotation changes are cancelled
      if (this.rotations) {
        this.$store.dispatch("edit/setRotations", this.createRotations());
        this.$store.dispatch(
          "edit/setRotationsForBackend",
          this.createRotations()
        );
      }

      this.$store.dispatch("edit/setSplitPages", null);
    },
    handleShowError() {
      this.$emit("handle-error", true);
    },
    handleMessage(message) {
      this.$emit("handle-message", message);
    },

    /** ROTATE */
    createRotations() {
      return this.pages.map(page => {
        return {
          id: page.id,
          angle: 0,
          page_number: page.number
        };
      });
    },
    rotateSinglePage(pageId, pageNumber) {
      this.$store.dispatch("edit/updateSinglePageRotation", {
        pageId,
        pageNumber
      });
    },
    handleRotationToTheLeft() {
      this.$store.dispatch("edit/updateRotationToTheLeft");
    },
    handleRotationToTheRight() {
      this.$store.dispatch("edit/updateRotationToTheRight");
    },
    getRotation(pageId) {
      // rotate page
      return this.rotations?.find(rotation => rotation.id === pageId)?.angle;
    },
    handleRotationSubmission() {
      // Remove id from rotation object since the backend doesn't need it
      const updatedRotations = this.rotationsForBackend.map(rotation => {
        delete rotation.id;
        return rotation;
      });

      // Only keep pages that were rotated, so those with angle !== 0
      const changedRotations = updatedRotations.filter(
        rotation => rotation.angle != 0
      );

      if (changedRotations.length === 0) {
        this.handleCloseEditing();
        return;
      }

      this.$store.dispatch("document/startLoading");
      this.$store.dispatch("document/startRecalculatingAnnotations");

      // Dispatch request to the store to rotate
      this.$store
        .dispatch("edit/updatePageRotation", changedRotations)
        .then(response => {
          const sleep = duration =>
            new Promise(resolve => setTimeout(resolve, duration));
          // Poll document data until the status_data is 111 (error) or
          // 2 and labeling is available (done)
          const pollUntilLabelingAvailable = duration => {
            return this.$store
              .dispatch("document/updateDocument", {})
              .then(async () => {
                if (
                  this.selectedDocument.status_data === 2 &&
                  this.selectedDocument.labeling_available === 1
                ) {
                  // set to null so DocumentLabelSets can reset it when watching
                  // the new groupedAnnotationSets
                  setTimeout(async () => {
                    await this.$store.dispatch(
                      "document/setActiveAnnotationSet",
                      null
                    );
                    await this.$store.dispatch("document/fetchAnnotations");
                    return true;
                  }, 5000);
                } else if (this.selectedDocument.status_data === 111) {
                  return false;
                } else {
                  return sleep(duration).then(() =>
                    pollUntilLabelingAvailable(duration)
                  );
                }
              });
          };

          // Check if the response is successfull or not
          if (response) {
            pollUntilLabelingAvailable(5000);
          } else {
            this.handleShowError();
            this.handleMessage(this.$i18n.t("edit_error"));
          }
        })
        .catch(error => {
          console.log(error);
          this.handleShowError();
          this.handleMessage(this.$i18n.t("edit_error"));
        })
        .finally(async () => {
          // Stop loading
          await this.$store.dispatch("document/endLoading");
          await this.$store.dispatch("document/endRecalculatingAnnotations");
        });

      // Whether the rotation worked properly or not close editing mode
      this.handleCloseEditing();
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
        item => item === page.number
      );

      if (found) {
        this.activeSplittingLines.splice(page.number - 1, 1, 0);
      } else {
        this.activeSplittingLines.splice(page.number - 1, 1, page.number);
      }

      this.saveSplitPages();
    },
    saveSplitPages() {
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
      this.$store.dispatch("edit/setSplitPages", pageObjectArray);
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
    handleSplitOverview() {
      // This will take the user to the final step,
      // which is the overview
      this.splitOverview = true;
      this.closeSplitOverview = false;

      this.splitFileNameFromExtension();
      this.saveDocument();
    },
    saveDocument() {
      // If there was no splitting, we just update the splitPages array
      // to have 1 item with all the pages in the document
      if (this.splitPages === null || this.splitPages.length === 0) {
        const document = [
          {
            name: this.selectedDocument.data_file_name,
            category: this.selectedDocument.category,
            pages: this.pagesArray
          }
        ];

        this.$store.dispatch("edit/setSplitPages", document);
      }
    },

    /** SORT */
    checkMove(e) {
      // Save the page placed originally where the page we are dragging will go
      this.prevPageAtIndex = this.pagesArray.find(
        page => this.pagesArray.indexOf(page) === e.draggedContext.futureIndex
      );
    },
    handleEnd() {
      this.draggable = false;

      // Update page numbers
      this.pagesArray = this.pagesArray.map(page => {
        const index = this.pagesArray.indexOf(page);
        return {
          ...page,
          number: index + 1
        };
      });

      this.saveDocument();
    }
  },
  watch: {
    pages() {
      if (!this.selectedDocument) return;

      if (this.pages.length === this.selectedDocument.number_of_pages) {
        this.setPages();
      }
    },
    closeSplitOverview(newValue) {
      if (newValue) {
        this.splitOverview = false;
      }
    }
  },
  mounted() {
    this.setPages();
  },
  updated() {
    if (this.pages.length > 12) {
      this.scroll = true;
    }
  }
};
</script>
