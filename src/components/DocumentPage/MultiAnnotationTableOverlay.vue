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
        v-for="(item, index) in columns"
        :key="index"
        :field="item.field"
        :label="item.label.name"
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

            <div v-if="editingLabels.length === 0">
              <b-dropdown-item
                aria-role="listitem"
                custom
                @click="editLabel(item)"
                ><span>{{ $t("edit_label") }}</span></b-dropdown-item
              >
              <b-dropdown-item
                aria-role="listitem"
                class="delete-action"
                @click="deleteColumn(item)"
              >
                <span>{{ $t("delete_label") }}</span></b-dropdown-item
              >
            </div>
            <div v-else>
              <b-dropdown-item
                v-for="label in editingLabels"
                :key="label.id"
                aria-role="listitem"
                :disabled="label.disabled"
                ><span @click="chooseLabel(item)">{{
                  label.name
                }}</span></b-dropdown-item
              >
            </div>
          </b-dropdown>
        </template>

        <template #default="props">
          <div class="annotation-content">
            <AnnotationRow
              :annotation="props.row[item.field]"
              :label="item.label"
              :annotation-set="item.annotationSet"
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
      editingLabels: [],
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

    async editLabel(column) {
      this.$store
        .dispatch(
          "project/fetchLabelSetDetails",
          column.annotationSet.label_set.id
        )
        .then(async (labelSet) => {
          this.editingLabels = [];

          labelSet.labels.forEach((label) => {
            const dropdownLabel = {
              ...label,
              disabled:
                this.columns.find((column) => column.label.id === label.id) !==
                undefined,
            };
            this.editingLabels.push(dropdownLabel);
          });
        });
    },

    async chooseLabel(column, label) {
      console.log("column", column.label);
      console.log("label", label);
      return;
      for (let i = 0; i < this.rows.length; i++) {
        const annotationToUpdate = this.rows[i][column.label.id];
        await this.$store
          .dispatch("document/updateAnnotation", {
            annotationId: annotationToUpdate.id,
            updatedValues: { label: label.id },
          })
          .catch((error) => {
            this.$store.dispatch("document/createErrorMessage", {
              error,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          });
      }
    },

    async deleteColumn(column) {
      console.log("columnn", column.label.id);
      console.log("rows", this.rows);
      console.log("ann", this.rows[0][column.label.id]);
      return;

      for (let i = 0; i < this.rows.length; i++) {
        const annotationToDelete = this.rows[i][column.label.id];
        await this.$store
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
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_overlay.scss"
></style>
