<template>
  <div class="multi-ann-table-overlay">
    <b-table
      ref="table"
      class="multi-ann-set-table dark-header"
      detail-icon="faScissors"
      :data="rows"
      :columns="columns"
      :sticky-header="true"
      :narrowed="true"
      :bordered="false"
    />
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "MultiAnnotationTablePopup",
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
      counter: 0,
      draggingColumn: null,
      draggingColumnIndex: null,
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
              label: label.name,
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
            row[label.id] = label.annotations[0].offset_string;
            orderedAnnotations.push(label.annotations[0]);
          }
        });
        this.rows.push(row);
      });
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_overlay.scss"
></style>
