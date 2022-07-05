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
              <div class="icon">
                <RotateLeftBlack />
              </div>
              <div class="icon">
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
  components: {
    RotateLeftBlack,
    RotateRightBlack,
    DocumentThumbnails
  },
  methods: {
    handleSinglePageRotation(pageId) {
      // If the item already exists in the array, update it to the new rotation
      if (this.rotations.find(rotation => rotation.id === pageId)) {
        this.rotations = this.rotations.map(rotation => {
          if (rotation.id === pageId) {
            return { ...rotation, value: rotation.value - 90 };
          }
          return rotation;
        });
      } else {
        // If there is no existing item in the array, add it
        this.rotations.push({
          id: pageId,
          value: -90
        });
      }
    },
    closeModal() {
      this.$emit("close-modal");
    },
    handleApplyBtn() {
      /**
       * TODO: finish backend call + polling endpoint
       * until its status_data is 2 (done) or 111 (error).
       */

      // const updatedAngle = {
      // page_number: this.page_number,
      //angle: this.angle
      // };

      // this.$store
      //   .dispatch("document/updatePageRotation", updatedAngle)
      //   .then(response => {
      //     // Check if the response is successfull or not
      //     if (response) {
      //       // show loading in label section
      //     } else {
      //       // show error msg
      //     }
      //   });
      this.closeModal();
    }
  }
};
</script>
