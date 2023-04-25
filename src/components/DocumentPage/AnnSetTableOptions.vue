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
        <span class="ann-set-label-set-name">{{ labelSetName }}</span>
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
import { mapGetters, mapState } from "vuex";
import SettingsIcon from "../../assets/images/SettingsIcon";

export default {
  name: "AnnSetTableOptions",
  components: {
    SettingsIcon,
  },
  props: {
    page: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapGetters("document", [
      "annotationSetsInTable",
      "annotationsInAnnotationsSets",
    ]),
    ...mapGetters("display", ["bboxToPoint"]),
    ...mapState("display", ["showAnnSetTable"]),
    labelSetName() {
      return this.showAnnSetTable[0].label_set.name;
    },
    coordinates() {
      let x = 0;
      let y = 0;
      const paddingTop = 55;

      this.showAnnSetTable.forEach((annotationSet) => {
        if (
          annotationSet.labels &&
          annotationSet.labels.length > 0 &&
          annotationSet.labels[0].annotations
        ) {
          annotationSet.labels[0].annotations.forEach((annotation) => {
            annotation.span.forEach((span) => {
              if (x === 0 || span.x0 < x) {
                x = span.x0;
              }
              if (y === 0 || span.y0 < y) {
                y = span.y0 + paddingTop;
              }
            });
          });
        }
      });
      return this.bboxToPoint(this.page, { x, y });
    },
  },
  methods: {
    handleDelete() {
      const annotationsToDelete = this.annotationsInAnnotationsSets(
        this.showAnnSetTable
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
      this.$store.dispatch("display/showAnnSetTable", null);
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/ann_set_table_options.scss"
></style>
