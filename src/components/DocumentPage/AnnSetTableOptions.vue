<template>
  <div
    class="ann-set-table-header"
    :style="{ left: `${coordinates.x}px`, top: `${coordinates.y}px` }"
  >
    <b-dropdown
      aria-role="list"
      class="ann-set-table-header-dropdown"
      position="is-top-right"
    >
      <template #trigger>
        <span class="ann-set-label-set-name">{{
          firstAnnotationSet.label_set.name
        }}</span>
        <SettingsIcon />
      </template>
      <b-dropdown-item
        aria-role="listitem"
        class="delete-action"
        @click="handleDelete()"
      >
        <span>{{ $t("delete_table") }}</span></b-dropdown-item
      >
    </b-dropdown>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import SettingsIcon from "../../assets/images/SettingsIcon";

export default {
  name: "AnnSetTableOptions",
  components: {
    SettingsIcon,
  },
  computed: {
    ...mapGetters("document", [
      "annotationSetsInTable",
      "annotationsInAnnotationsSets",
    ]),
    firstAnnotationSet() {
      return this.annotationSetsInTable()[0];
    },
    coordinates() {
      let x = 0;
      let y = 0;
      if (
        this.firstAnnotationSet.labels &&
        this.firstAnnotationSet.labels.length > 0 &&
        this.firstAnnotationSet.labels[0].annotations &&
        this.firstAnnotationSet.labels[0].annotations.length > 0 &&
        this.firstAnnotationSet.labels[0].annotations[0].span &&
        this.firstAnnotationSet.labels[0].annotations[0].span.length > 0
      ) {
        x = this.firstAnnotationSet.labels[0].annotations[0].span[0].x0;
        y = this.firstAnnotationSet.labels[0].annotations[0].span[0].y0;
      }
      return { x, y: y - 40 };
    },
  },
  methods: {
    handleDelete() {
      const annotationsToDelete = this.annotationsInAnnotationsSets(
        this.annotationSetsInTable()
      );

      for (let i = 0; i < annotationsToDelete.length; i++) {
        const annotationToDelete = annotationsToDelete[i];
        this.$store
          .dispatch("document/deleteAnnotation", {
            annotationId: annotationToDelete.id,
          })
          .catch((error) => {
            this.$store.dispatch("document/createErrorMessage", {
              error,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          });
      }
      this.$store.dispatch("display/showAnnSetTable", false);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/ann_set_table_options.scss"
></style>
