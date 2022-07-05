<style
  scoped
  lang="scss"
  src="../../assets/scss/document_rotate_pages_modal.scss"
></style>

<template>
  <section>
    <b-modal v-model="isModalActive" :can-cancel="['x']">
      <div class="modal-card">
        <div class="header">
          <h3>
            {{ $t("rotate_pages") }}
          </h3>
        </div>
        <div class="pages-container">
          <DocumentThumbnails
            :filter="filter"
            :rotations="rotations"
            @rotate-single-page="handleSinglePageRotation"
          />
        </div>
        <div class="footer">
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
        </div>
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
      rotations: []
    };
  },
  props: {
    isModalActive: {
      type: Boolean
    }
  },
  computed: {
    ...mapState("document", ["pages"])
  },
  components: {
    RotateLeftBlack,
    RotateRightBlack,
    DocumentThumbnails
  },
  methods: {
    handleSinglePageRotation({ pageId, pageNumber }) {
      // If the item already exists in the array, update it to the new rotation
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
      }
      // else {
      //   // If there is no existing item in the array, add it
      //   this.rotations.push({
      //     id: pageId,
      //     page_number: pageNumber,
      //     angle: -90
      //   });
      // }
    },
    handleAntiClockwiseMultiPageRotation() {
      this.rotations = this.rotations.map(rotation => {
        return { ...rotation, angle: rotation.angle - 90 };
      });
    },
    handleClockwiseMultiPageRotation() {
      this.rotations = this.rotations.map(rotation => {
        return { ...rotation, angle: rotation.angle + 90 };
      });
    },
    closeModal() {
      this.$emit("close-modal");
    },
    handleApplyBtn() {
      /**
       * TODO: finish backend call + polling endpoint
       * until its status_data is 2 (done) or 111 (error).
       */

      const updatedRotations = this.rotations.map(rotation => {
        delete rotation.id;
        return rotation;
      });

      this.$store
        .dispatch("document/updatePageRotation", updatedRotations)
        .then(response => {
          // Check if the response is successfull or not
          if (response) {
            // show loading in label section
          } else {
            // show error msg
          }
        });
      this.closeModal();
    }
  },
  watch: {
    pages(newValue) {
      if (newValue.length) {
        this.rotations = this.pages.map(page => {
          return { id: page.id, angle: 0, page_number: page.number };
        });
      }
    }
  }
};
</script>
