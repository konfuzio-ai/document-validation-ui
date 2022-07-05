<style
  scoped
  lang="scss"
  src="../../assets/scss/document_rotate_pages_modal.scss"
></style>

<template>
  <section>
    <b-modal v-model="isModalActive" :can-cancel="['x']">
      <div class="modal-card">
        <header class="modal-card-head">
          <h3>
            {{ $t("rotate_pages") }}
          </h3>
        </header>
        <section class="modal-card-body">
          <DocumentThumbnails
            :filter="filter"
            :rotationModal="rotationModal"
            :rotations="rotations"
            @rotate-single-page="handleSinglePageRotation"
          />
        </section>
        <footer class="modal-card-foot">
          <div class="footer-left">
            <div>{{ $t("rotate_all") }}</div>
            <div class="rotate-icons">
              <div class="icon" @click="handleAntiClockwiseMultiPageRotation">
                <RotateLeftBlack />
              </div>
              <div class="icon" @click="handleClockwiseMultiPageRotation">
                <RotateRightBlack />
              </div>
            </div>
          </div>
          <div class="footer-right">
            <button class="cancel-btn btn" @click="closeRotationModal">
              {{ $t("cancel") }}
            </button>
            <button class="apply-btn btn" @click="handleApplyBtn">
              {{ $t("apply") }}
            </button>
          </div>
        </footer>
      </div>
    </b-modal>
    <div class="confirm-rotation" v-if="confirmationModalOpen">
      <ConfirmationModal
        @close-modal="closeConfirmationModal"
        @handle-confirmation="handleRotationConfirmation"
        :isConfirmationModalActive="isConfirmationModalActive"
      />
    </div>
  </section>
</template>

<script>
import { mapState } from "vuex";
import RotateLeftBlack from "../../assets/images/RotateLeftBlack";
import RotateRightBlack from "../../assets/images/RotateRightBlack";
import DocumentThumbnails from "../DocumentThumbnails/DocumentThumbnails";
import ConfirmationModal from "./ConfirmationModal";

export default {
  name: "RotatePagesModal",
  data() {
    return {
      filter: true,
      rotationModal: true,
      rotations: [],
      rotationsToSave: [],
      confirmationModalOpen: true,
      isConfirmationModalActive: false
    };
  },
  props: {
    isModalActive: {
      type: Boolean
    },
    setRotations: {
      type: Boolean
    },
    handleShowError: {
      type: Function
    },
    handleMessage: {
      type: Function
    }
  },
  computed: {
    ...mapState("document", ["pages"]),
    ...mapState("document", ["selectedDocument"])
  },
  components: {
    RotateLeftBlack,
    RotateRightBlack,
    DocumentThumbnails,
    ConfirmationModal
  },
  methods: {
    handleSinglePageRotation({ pageId, pageNumber }) {
      // If the item already exists in the array, update it to the new rotation

      // Rotations for frontend purposes
      if (this.rotations.find(rotation => rotation.id === pageId)) {
        this.rotations = this.rotations.map(rotation => {
          if (rotation.id === pageId) {
            return {
              ...rotation,
              angle: rotation.angle - 90,
              rotations: rotation.rotations + 1
            };
          }
          return rotation;
        });

        // Rotations to send in the POST request
        if (this.rotationsToSave.find(rotation => rotation.id === pageId)) {
          this.rotationsToSave = this.rotationsToSave.map(rotation => {
            if (rotation.id === pageId) {
              let rotatedAngle = rotation.angle - 90;

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
          // If there is no existing item in the array, add it

          // Rotations for frontend purposes
          this.rotations.push({
            id: pageId,
            page_number: pageNumber,
            angle: -90
          });

          // Rotations to send in the POST request
          this.rotationsToSave.push({
            id: pageId,
            page_number: pageNumber,
            angle: -90
          });
        }
      }
    },
    handleAntiClockwiseMultiPageRotation() {
      // Rotations for frontend purposes
      this.rotations = this.rotations.map(rotation => {
        return { ...rotation, angle: rotation.angle - 90 };
      });

      // Rotations to send in the POST request
      this.rotationsToSave = this.rotationsToSave.map(rotation => {
        let rotatedAngle = rotation.angle - 90;
        if (rotatedAngle === -270) {
          rotatedAngle = 90;
        }
        return { ...rotation, angle: rotatedAngle };
      });
    },
    handleClockwiseMultiPageRotation() {
      // Rotations for frontend purposes
      this.rotations = this.rotations.map(rotation => {
        return { ...rotation, angle: rotation.angle + 90 };
      });

      // Rotations to send in the POST request
      this.rotationsToSave = this.rotationsToSave.map(rotation => {
        let rotatedAngle = rotation.angle + 90;
        if (rotatedAngle === 270) {
          rotatedAngle = -90;
        }
        return { ...rotation, angle: rotatedAngle };
      });
    },
    closeRotationModal() {
      this.$emit("close-modal");

      // Set rotation angles to default when canceling changes
      // Timeout so that they rotate after the modal is closed
      setTimeout(() => {
        this.rotations = this.rotations.map(rotation => {
          return {
            ...rotation,
            angle: 0
          };
        });

        this.rotationsToSave = [];
      }, 1000);
    },
    closeConfirmationModal() {
      this.isConfirmationModalActive = !this.isConfirmationModalActive;
    },
    handleApplyBtn() {
      // Open confirmation modal
      this.isConfirmationModalActive = true;
    },
    handleRotationConfirmation() {
      // Remove id from rotation object since the backend doesn't need it
      const updatedRotations = this.rotationsToSave.map(rotation => {
        delete rotation.id;
        return rotation;
      });

      // Only keep pages that were rotated, so angle not 0
      const changedRotations = updatedRotations.filter(
        rotation => rotation.angle != 0
      );

      if (changedRotations.length === 0) {
        this.closeConfirmationModal();
        this.closeRotationModal();
        return;
      }

      // this.$store.dispatch("document/startLoading");
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
              .then(() => {
                if (
                  this.selectedDocument.status_data === 2 &&
                  this.selectedDocument.labeling_available === 1
                ) {
                  this.$store.dispatch("document/fetchAnnotations").then(() => {
                    this.$store.dispatch(
                      "document/endRecalculatingAnnotations"
                    );
                  });
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
            this.handleMessage(this.$i18n.t("rotation_failed"));
          }
        });

      // Whether the rotation worked properly or not, end loading and close both modals
      this.closeConfirmationModal();
      this.closeRotationModal();
    }
  },
  watch: {
    setRotations(newValue) {
      if (newValue) {
        if (this.pages.length) {
          this.rotations = this.pages.map(page => {
            return {
              id: page.id,
              angle: 0,
              page_number: page.number
            };
          });
        }
      }
    }
  }
};
</script>
