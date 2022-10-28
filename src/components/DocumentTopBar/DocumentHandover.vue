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

    <div class="handover-collapse">
      <b-collapse :open="open" aria-id="handover" class="is-bottom">
        <div class="notification">
          <div class="content">
            <div class="header container">
              <p class="title">{{ $t("handover_document") }}</p>
              <div
                type="button"
                @click="open = false"
                class="close-icon-container modal-btn"
              >
                <b-icon icon="xmark" class="close-btn" size="is-small" />
              </div>
            </div>
            <div class="input-container">
              <section
                :class="['input-section container', invalidEmail && 'invalid']"
              >
                <b-field type="input">
                  <b-input
                    :placeholder="$t('type_email')"
                    id="input"
                    autocomplete="off"
                    v-model="selected"
                    @input="invalidEmail = false"
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
              <div v-if="invalidEmail" class="invalid-email-msg">
                <p>{{ $t("invalid_email") }}</p>
              </div>
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
      selected: null,
      scroll: false,
      invalidEmail: false,
      regex:
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    };
  },
  computed: {
    // TODO: map members from store
  },
  methods: {
    emailValidation(email) {
      return email.toLowerCase().match(this.regex);
    },
    isMember() {
      const found = this.members.find(member => member.email === this.selected);

      if (found) {
        return true;
      }

      return false;
    },
    handleSelect(id, email) {
      const inputField = document.getElementById("input");

      if (id) {
        inputField.value = email;
        this.selected = email;
      }
    },
    handleHandover() {
      if (!this.selected) {
        return;
      }

      if (!this.emailValidation(this.selected)) {
        this.invalidEmail = true;
        return;
      }

      this.invalidEmail = false;
      this.isLoading = true;

      // TODO: dispatch to store to set the new owner of the doc
      let assignee;

      // Check if the user is already a member of the project or new member
      if (this.isMember()) {
        assignee = { assignee: `${this.selected}` };
      } else {
        assignee = { email: `${this.selected}`, role: "annotator" };
      }

      setTimeout(() => {
        this.isLoading = false;
        // this.snackbar();
        this.selected = null;
      }, 2000);
    },
    snackbar() {
      this.$buefy.snackbar.open({
        message: `
        ${this.$t("document_successfully_handed")} ${this.selected}`,
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
