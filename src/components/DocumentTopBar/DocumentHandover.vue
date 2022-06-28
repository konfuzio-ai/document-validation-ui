<style
  scoped
  lang="scss"
  src="../../assets/scss/document_handover.scss"
></style>

<template>
  <div class="handover-container">
    <b-button
      :label="$t('handover')"
      type="is-primary"
      aria-controls="handover"
      class="handover-btn"
      @click="open = true"
    />

    <b-collapse :open="open" aria-id="handover">
      <div class="notification">
        <div class="content">
          <div class="header container">
            <p class="title">{{ $t("handover_document") }}</p>
            <div
              type="button"
              @click="open = false"
              class="close-icon-container modal-btn"
            >
              <b-icon icon="xmark" class="close-btn" />
            </div>
          </div>
          <div class="input-container">
            <section class="input-section container">
              <b-field type="input">
                <b-input
                  :placeholder="$t('type_email')"
                  id="input"
                  autocomplete="off"
                  v-model="selected"
                />
              </b-field>
              <b-loading
                :is-full-page="isFullPage"
                v-model="isLoading"
                v-if="isLoading"
              >
                <b-icon
                  icon="spinner"
                  class="fa-spin loading-icon-size spinner"
                >
                </b-icon>
              </b-loading>
              <b-button
                v-else
                :label="$t('handover')"
                class="handover-btn-menu"
                @click.prevent="handleHandover"
              />
            </section>

            <transition name="slide-fade">
              <div v-if="showError" class="error-message handover">
                <b-message>
                  <div class="message-container">
                    {{ $t("handover_not_possible") }}
                  </div>
                  <div @click="showError = false" class="close-icon-container">
                    <b-icon icon="xmark" class="close-btn error-icon" />
                  </div>
                </b-message>
              </div>
            </transition>
          </div>
          <div class="members-section">
            <div class="members-title">
              <h3 class="title">{{ $t("members") }}</h3>
            </div>
            <div :class="['member-list', scroll && 'scroll']">
              <div v-for="member in members" :key="member.id">
                <div class="member container">
                  <p class="email">{{ member.email }}</p>
                  <b-button
                    :label="$t('select')"
                    class="select-btn"
                    @click="handleSelect(member.id, member.email)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </b-collapse>
  </div>
</template>

<script>
export default {
  name: "DocumentHandover",
  data() {
    return {
      isComponentModalActive: false,
      open: false,
      // TODO: bring list of members from the backend when endpoint is ready
      members: [
        { id: 1, email: "ch@konfuzio.com" },
        { id: 2, email: "fz@helm-nagel.com" },
        { id: 3, email: "ana@helm-nagel.com" },
        { id: 4, email: "ch@konfuzio.com" },
        { id: 5, email: "fz@helm-nagel.com" },
        { id: 6, email: "ana@helm-nagel.com" }
      ],
      isFullPage: false,
      isLoading: false,
      showError: false,
      selected: null,
      scroll: false
    };
  },
  methods: {
    handleSelect(id, email) {
      const inputField = document.getElementById("input");

      if (id) {
        inputField.value = email;
      }
    },
    handleHandover() {
      const inputField = document.getElementById("input");

      if (inputField.value.length === 0) {
        console.log("Need to add an email to handover");
        return;
      }

      this.selected = inputField.value;
      this.isLoading = true;

      // TODO: dispatch to store to set the new owner of the doc
      setTimeout(() => {
        this.isLoading = false;
        this.snackbar();
        // this.showError = true;
        this.selected = null;
      }, 2000);
    },
    snackbar() {
      // TODO: figure out how to add the close icon next to the text
      this.$buefy.snackbar.open({
        message: `
        ${this.$i18n.t("document_successfully_handed")} ${this.selected}
        `,
        actionText: null
      });
    }
  },
  updated() {
    if (this.members.length > 3) {
      this.scroll = true;
    }
  }
};
</script>
