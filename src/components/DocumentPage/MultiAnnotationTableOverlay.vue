<template>
  <div class="multi-ann-table-overlay">
    <b-table
      ref="table"
      class="multi-ann-set-table dark-header"
      detail-icon="faScissors"
      :data="rows"
      :sticky-header="true"
      :narrowed="true"
      :bordered="false"
    >
      <b-table-column
        v-for="(column, index) in columns"
        :key="index"
        v-slot="props"
        :field="column.field"
        :label="column.label.name"
      >
        <div
          class="annotation-content"
          @mouseenter="
            selectAnnotationInDocument(column.label, props.row[column.field])
          "
          @mouseleave="deselectAnnotationInDocument"
        >
          <AnnotationDetails
            is-small
            :description="column.description"
            :annotation="props.row[column.field]"
          />
          <span>{{ props.row[column.field].offset_string }}</span>
        </div>
      </b-table-column>
    </b-table>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AnnotationDetails from "../DocumentAnnotations/AnnotationDetails";

export default {
  name: "MultiAnnotationTablePopup",
  components: {
    AnnotationDetails,
  },
  props: {
    annotationsSets: {
      required: true,
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      rows: [],
      columns: [],
      orderedAnnotations: [],
    };
  },
  computed: {},
  mounted() {
    this.handleColumns();
    this.handleRows();
  },
  methods: {
    handleColumns() {
      this.columns = [];
      const labelAlreadyExists = (label) => {
        return (
          this.columns.length > 0 &&
          this.columns.find((a) => a.field === `${label.id}`) != undefined
        );
      };

      this.annotationsSets.forEach((annotationSet) => {
        annotationSet.labels.forEach((label) => {
          if (!labelAlreadyExists(label)) {
            const column = {
              field: `${label.id}`,
              label: label,
              centered: false,
            };
            this.columns.push(column);
          }
        });
      });
    },

    handleRows() {
      this.rows = [];
      this.orderedAnnotations = [];

      this.annotationsSets.forEach((annotationSet) => {
        let row = {};

        annotationSet.labels.forEach((label) => {
          if (label.annotations.length > 0) {
            row[label.id] = label.annotations[0];
            this.orderedAnnotations.push(label.annotations[0]);
          }
        });
        this.rows.push(row);
      });
    },
    selectAnnotationInDocument(label, annotation) {
      this.$store.dispatch("document/setDocumentAnnotationSelected", {
        annotation: annotation,
        label: label,
        span: annotation.span[0],
        scrollTo: false,
      });
    },
    deselectAnnotationInDocument() {
      this.$store.dispatch("document/disableDocumentAnnotationSelected");
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_overlay.scss"
></style>
