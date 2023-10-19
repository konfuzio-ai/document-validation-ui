<template>
  <div
    class="ann-set-table-header"
    :style="{ left: `${coordinates.x}px`, top: `${coordinates.y}px` }"
  >
    <b-dropdown
      aria-role="list"
      class="ann-set-table-header-dropdown"
      position="is-top-right"
      scrollable
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
      let xFinal = 0;
      let yFinal = 0;
      const paddingTop = 40;

      this.showAnnSetTable.forEach((annotationSet) => {
        if (annotationSet.labels) {
          annotationSet.labels.forEach((label) => {
            label.annotations.forEach((annotation) => {
              annotation.span.forEach((span) => {
                const { x, y } = this.bboxToPoint(this.page, {
                  x: span.x0,
                  y: span.y0,
                });
                if (xFinal === 0 || x < xFinal) {
                  xFinal = x;
                }
                if (yFinal === 0 || y < yFinal) {
                  yFinal = y - paddingTop;
                }
              });
            });
          });
        }
      });
      return { x: xFinal, y: yFinal };
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
            annotationSet: null, // TODO: test if annotation set should be added if the feature is available again
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
