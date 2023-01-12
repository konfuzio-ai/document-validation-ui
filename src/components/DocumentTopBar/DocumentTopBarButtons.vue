<template>
  <div class="buttons">
    <b-button
      :label="$t('cancel')"
      class="button-cancel"
      type="is-default"
      @click="closeEditMode"
    />
    <b-button
      :label="
        editMode &&
        updatedDocument &&
        updatedDocument.length > 1 &&
        !splitOverview
          ? $t('next')
          : $t('submit')
      "
      type="is-primary"
      :disabled="false"
      class="button-next"
      @click="handleButton"
    />
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "DocumentTopBarButtons",
  computed: {
    ...mapState("document", ["selectedDocument"]),
    ...mapState("edit", ["editMode", "splitOverview", "updatedDocument"]),
  },
  methods: {
    /** EDIT MODE */
    closeEditMode() {
      this.$store.dispatch("edit/disableEditMode");
      this.$store.dispatch("edit/setSplitOverview", false);
      this.$store.dispatch("edit/setUpdatedDocument", null);
      this.$store.dispatch("edit/setSelectedPages", null);
      this.$nextTick(() => {
        // reset to first page
        this.$store.dispatch("display/updateCurrentPage", 1);
      });
    },
    handleButton() {
      // Check if we are not in the split overview
      // and if we have a split document
      if (!this.splitOverview && this.updatedDocument.length > 1) {
        // Enable the "next" button to go to the overview
        this.$store.dispatch("edit/setSplitOverview", true);
        this.$store.dispatch("edit/setSelectedPages", null);
      }

      // If we are in the overview (so more than 1 doc)
      // or in the edit mode (only 1 doc)
      else if (this.updatedDocument) {
        // Send update request to the backend
        this.$store
          .dispatch("edit/editDocument", this.updatedDocument)
          .then((response) => {
            if (!response) return;

            this.$store.dispatch("document/createErrorMessage", {
              response,
              typeOfMessage: null,
            });
          });

        // Close edit mode
        this.closeEditMode();
      }
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>
