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
      @click="open = true"
    />

    <b-collapse :open="open" aria-id="handover">
      <div class="notification">
        <div class="content">
          <div class="header container">
            <p class="title">{{ $t("handover_document") }}</p>
            <div type="button" @click="open = false" class="delete-btn">
              <b-icon icon="xmark" class="delete-icon" />
            </div>
          </div>
          <section class="input-section container">
            <b-field type="input">
              <b-input
                type="email"
                :placeholder="$t('type_email')"
                id="input"
                autocomplete="off"
              />
            </b-field>
            <b-button
              :label="$t('handover')"
              type="is-dark"
              class="handover-btn-menu"
              @click="handleHandover"
            />
          </section>
          <div class="members-section">
            <div class="members-title">
              <h3 class="title">{{ $t("members") }}</h3>
            </div>
            <div class="member-list">
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
      members: [
        { id: 1, email: "ch@konfuzio.com" },
        { id: 2, email: "fz@helm-nagel.com" },
        { id: 3, email: "ana@helm-nagel.com" },
        { id: 4, email: "ch@konfuzio.com" },
        { id: 5, email: "fz@helm-nagel.com" },
        { id: 6, email: "ana@helm-nagel.com" }
      ]
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
      inputField.value = null;
    }
  }
};
</script>
