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
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">1</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">2</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">3</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">4</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">5</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">6</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">7</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">8</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">9</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">7</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">8</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">9</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">7</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">8</div>
          </div>
          <div class="page-container">
            <div class="page"></div>
            <div class="page-number">9</div>
          </div>
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
            <button class="cancel-btn btn" @click="handleCancelBtn">
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

export default {
  name: "RotatePagesModal",
  data() {
    return {
      isModalActive: true
    };
  },
  components: {
    RotateLeftBlack,
    RotateRightBlack
  },
  methods: {
    handleCancelBtn() {
      this.isModalActive = false;
    },
    handleApplyBtn() {
      this.isModalActive = false;
    }
  }
};
</script>
