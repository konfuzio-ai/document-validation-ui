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
        :field="column.field"
        :label="column.label.name"
      >
        <template #header="{ column }">
          <b-dropdown aria-role="list" class="header-dropdown">
            <template #trigger="{ active }">
              <span :class="active ? 'active' : ''"
                >{{ column.label }}
                <b-icon
                  :icon="active ? 'angle-up' : 'angle-down'"
                  size="is-small"
              /></span>
            </template>

            <b-dropdown-item aria-role="listitem"
              ><span @click="editLabel">{{
                $t("edit_label")
              }}</span></b-dropdown-item
            >
            <b-dropdown-item aria-role="listitem" class="delete-action">
              <span @click="deleteLabel">{{
                $t("delete_label")
              }}</span></b-dropdown-item
            >
          </b-dropdown>
        </template>

        <template #default="props">
          <div class="annotation-content">
            <AnnotationRow
              :annotation="props.row[column.field]"
              :label="column.label"
              :annotation-set="column.annotationSet"
              :show-label="false"
              :show-buttons="false"
              :is-small="true"
            />
          </div>
        </template>
      </b-table-column>
    </b-table>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AnnotationRow from "../DocumentAnnotations/AnnotationRow";

export default {
  name: "MultiAnnotationTablePopup",
  components: {
    AnnotationRow,
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
              annotationSet,
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

    editLabel() {
      alert("edit label");
    },

    deleteLabel() {
      alert("delete label");
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_overlay.scss"
></style>
