<style scoped lang="scss" src="../../assets/scss/document_edit.scss"></style>
<template>
  <div class="document-edit">
    <EditTopBar
      @cancel-editing="handleCancelEditing"
      @submit-rotation="handleRotationSubmission"
    />
    <div :class="['document-grid', scroll && 'scroll']">
      <div
        v-for="(page, index) in pages"
        v-bind:key="index"
        class="image-section"
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
                :class="['img-thumbnail', recalculatingAnnotations && 'blur']"
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
      </div>
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
import ServerImage from "../../assets/images/ServerImage";
/**
 * This component shows a document thumbnail grid view to be able to edit the document.
 */
export default {
  name: "DocumentEdit",
  components: {
    EditTopBar,
    EditFooter,
    ServerImage
  },
  data() {
    return {
      rotations: [],
      rotationsForBackend: [],
      scroll: false
    };
  },
  computed: {
    ...mapState("document", [
      "pages",
      "editMode",
      "editOptions",
      "recalculatingAnnotations",
      "selectedDocument"
    ]),
    ...mapState("display", ["currentPage"])
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
        this.rotations = this.pages.map(page => {
          return {
            id: page.id,
            angle: 0,
            page_number: page.number
          };
        });

        this.rotationsForBackend = this.pages.map(page => {
          return {
            id: page.id,
            angle: 0,
            page_number: page.number
          };
        });
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
    rotateSinglePage(pageId, pageNumber) {
      // If the item already exists in the array and matches the clicked one, update it to the new rotation
      if (this.rotations.find(rotation => rotation.id === pageId)) {
        this.rotations = this.rotations.map(rotation => {
          if (rotation.id === pageId) {
            return {
              ...rotation,
              angle: rotation.angle - 90
            };
          }
          return rotation;
        });

        // Rotations to send to the backend
        // due to only allowing -90 to 180 angles
        if (this.rotationsForBackend.find(rotation => rotation.id === pageId)) {
          this.rotationsForBackend = this.rotationsForBackend.map(rotation => {
            let rotatedAngle = rotation.angle - 90;
            if (rotation.id === pageId) {
              if (rotatedAngle === -270) {
                rotatedAngle = 90;
              }
              return {
                ...rotation,
                angle: rotatedAngle
              };
            }
            return rotation;
          });
        } else {
          this.rotationsForBackend.push({
            id: pageId,
            page_number: pageNumber,
            angle: -90
          });
        }
      } else {
        this.rotations.push({
          id: pageId,
          page_number: pageNumber,
          angle: -90
        });
      }
    },
    handleRotationToTheLeft() {
      // Rotations for frontend purposes
      this.rotations = this.rotations.map(rotation => {
        return { ...rotation, angle: rotation.angle - 90 };
      });

      // Rotations to send in the POST request
      this.rotationsForBackend = this.rotationsForBackend.map(rotation => {
        let rotatedAngle = rotation.angle - 90;
        if (rotatedAngle === -270) {
          rotatedAngle = 90;
        }
        return { ...rotation, angle: rotatedAngle };
      });
    },
    handleRotationToTheRight() {
      // Rotations for frontend purposes
      this.rotations = this.rotations.map(rotation => {
        return { ...rotation, angle: rotation.angle + 90 };
      });

      // Rotations to send in the POST request
      this.rotationsForBackend = this.rotationsForBackend.map(rotation => {
        let rotatedAngle = rotation.angle + 90;
        if (rotatedAngle === 270) {
          rotatedAngle = -90;
        }
        return { ...rotation, angle: rotatedAngle };
      });
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

      // Only keep pages that were rotated, so angle not 0
      const changedRotations = updatedRotations.filter(
        rotation => rotation.angle != 0
      );

      if (changedRotations.length === 0) {
        this.handleCancelEditing();
        return;
      }

      this.$store.dispatch("document/startLoading");
      this.$store.dispatch("document/startRecalculatingAnnotations");

      // Dispatch request to the store to rotate
      this.$store
        .dispatch("document/updatePageRotation", changedRotations)
        .then(response => {
          const sleep = duration =>
            new Promise(resolve => setTimeout(resolve, duration));
          // Poll document data until the status_data is 111 (error) or
          // 2 and labeling is available (done)
          const pollUntilLabelingAvailable = duration => {
            return this.$store
              .dispatch("document/fetchDocumentData")
              .then(async () => {
                if (
                  this.selectedDocument.status_data === 2 &&
                  this.selectedDocument.labeling_available === 1
                ) {
                  // set to null so DocumentLabelSets can reset it when watching
                  // the new groupedAnnotationSets
                  await this.$store.dispatch(
                    "document/setActiveAnnotationSet",
                    null
                  );
                  await this.$store.dispatch("document/fetchAnnotations");
                  await this.$store.dispatch(
                    "document/endRecalculatingAnnotations"
                  );
                  return true;
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
            this.handleMessage();
          }
        });

      // Whether the rotation worked properly or not, end loading and close both modals
      this.handleCancelEditing();
    },
    handleCancelEditing() {
      this.$store.dispatch("document/disableEditMode").then(() => {
        this.$store.dispatch("display/updateFit", "width");
      });

      // Reset the rotation angles to 0 if rotation changes are cancelled
      if (this.rotations) {
        this.rotations = this.rotations.map(rotation => {
          return {
            ...rotation,
            angle: 0
          };
        });

        this.rotationsForBackend = this.rotationsForBackend.map(rotation => {
          return {
            ...rotation,
            angle: 0
          };
        });
      }
    },
    handleShowError() {
      this.$emit("handle-error", true);
    },
    handleMessage() {
      this.$emit("handle-message", this.$i18n.t("edit_error"));
    }
  },
  watch: {
    pages() {
      this.setPages();
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
