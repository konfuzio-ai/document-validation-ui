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
            <button class="cancel-btn btn" @click="closeModal">
              {{ $t("cancel") }}
            </button>
            <button class="apply-btn btn" @click="handleApplyBtn">
              {{ $t("apply") }}
            </button>
          </div>
        </footer>
      </div>
    </b-modal>
  </section>
</template>

<script>
import { mapState } from "vuex";
import RotateLeftBlack from "../../assets/images/RotateLeftBlack";
import RotateRightBlack from "../../assets/images/RotateRightBlack";
import DocumentThumbnails from "../DocumentThumbnails/DocumentThumbnails";

export default {
  name: "RotatePagesModal",
  data() {
    return {
      filter: true,
      rotationModal: true,
      rotations: [],
      rotationsToSave: []
    };
  },
  props: {
    isModalActive: {
      type: Boolean
    },
    setRotations: {
      type: Boolean
    }
  },
  computed: {
    ...mapState("document", ["pages"]),
    ...mapState("document", ["selectedDocument"])
  },
  components: {
    RotateLeftBlack,
    RotateRightBlack,
    DocumentThumbnails
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
    closeModal() {
      this.$emit("close-modal");

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
    handleApplyBtn() {
      // Remove id from rotation object since the backend doesn't need it
      const updatedRotations = this.rotationsToSave.map(rotation => {
        delete rotation.id;
        return rotation;
      });

      // Only keep pages that were rotated, so angle not 0
      const changedRotations = updatedRotations.filter(
        rotation => rotation.angle != 0
      );

      // this.$store.dispatch("document/startLoading");
      this.$store.dispatch("document/startRecalculatingAnnotations");

      // Dispatch request to the store to rotate
      this.$store
        .dispatch("document/updatePageRotation", changedRotations)
        .then(response => {
          // Check if the response is successfull or not
          if (response) {
            // Poll document data until the status_data is 2 (done) or 111 (error)
            const intId = setInterval(() => {
              this.$store.dispatch("document/fetchDocumentData");

              if (this.selectedDocument.status_data === 2) {
                clearInterval(intId);
                return;
              }

              if (this.selectedDocument.status_data === 111) {
                clearInterval(intId);
                return;
              }
            }, 3000);
          } else {
            // show error msg
          }
        })
        .finally(() => {
          // this.$store.dispatch("document/endLoading");
          this.$store.dispatch("document/endRecalculatingAnnotations");
        });

      // Whether the rotation worked properly or not, end loading and close modal
      this.closeModal();
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
