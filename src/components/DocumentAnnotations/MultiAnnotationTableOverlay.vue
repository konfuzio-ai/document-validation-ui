<template>
  <div
    class="multi-ann-table-overlay"
    :style="{
      left: `${left}px`,
      width: `${width === 0 ? '100%' : `${width}px`}`,
    }"
  >
    <b-table
      ref="table"
      class="multi-ann-set-table dark-header header-32"
      detail-icon="faScissors"
      :data="rows"
      :sticky-header="true"
      :narrowed="true"
      :bordered="false"
      draggable-column
      @columndragstart="columndragstart"
      @columndrop="columndrop"
      @columndragover="columndragover"
      @columndragleave="columndragleave"
    >
      <b-table-column
        v-for="(item, index) in isLoading ? [columns[0]] : columns"
        :key="index"
        :field="item.field"
        :label="item.label.name"
      >
        <template #header="{ column }">
          <b-dropdown
            :ref="getDropdownReference(item)"
            aria-role="list"
            class="header-dropdown"
            position="is-top-right"
            :close-on-click="false"
            @active-change="(e) => onDropdownChange(item, e)"
          >
            <template #trigger="{ active }">
              <DraggableIcon v-if="!isLoading" class="draggable" />
              <span v-if="!isLoading" :class="active ? 'active' : ''"
                >{{ column.label }}
              </span>
              <b-icon
                v-if="!isLoading"
                :icon="active ? 'angle-up' : 'angle-down'"
                size="is-small"
                class="arrow"
              />
            </template>

            <div v-if="editingLabels.length === 0">
              <b-dropdown-item aria-role="listitem" @click="editLabel(item)"
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
                ><span @click="!label.disabled && changeLabel(item, label)">{{
                  label.name
                }}</span></b-dropdown-item
              >
            </div>
          </b-dropdown>
        </template>

        <template #default="props">
          <div class="annotations-table">
            <b-skeleton v-if="isLoading" width="98%" height="90%" />
            <AnnotationRow
              v-if="!isLoading"
              :annotation="props.row[item.field]"
              :label="item.label"
              :annotation-set="item.annotationSet"
              :show-label="false"
              :show-buttons="false"
              :is-small="true"
              :from-table="true"
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
import DraggableIcon from "../../assets/images/DraggableIcon";

export default {
  name: "MultiAnnotationTablePopup",
  components: {
    AnnotationRow,
    DraggableIcon,
  },
  props: {
    left: {
      type: Number,
      required: false,
      default: 0,
    },
    width: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  data() {
    return {
      rows: [],
      columns: [],
      orderedAnnotations: [],
      editingLabels: [],
      openDropdown: null,
      draggingColumnIndex: null,
      isLoading: false,
    };
  },
  computed: {
    ...mapState("display", ["showAnnSetTable"]),
    ...mapState("document", ["annotations"]),
  },
  watch: {
    showAnnSetTable() {
      this.handleColumns();
      this.handleRows();
    },
    annotations() {
      // if there's a change in the annotations content, we update the table
      this.handleColumns();
      this.handleRows();
    },
    columns(columns) {
      if (!columns || (columns && columns.length === 0)) {
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("document/resetEditAnnotation");
        this.$store.dispatch("display/showAnnSetTable", null);
      }
    },
  },
  mounted() {
    this.handleColumns();
    this.handleRows();
  },
  methods: {
    getDropdownReference(column) {
      return `editDropdown_${column.field}`;
    },
    handleColumns() {
      this.columns = [];
      const labelAlreadyExists = (label) => {
        return (
          this.columns.length > 0 &&
          this.columns.find((a) => a.field === `${label.id}`) != undefined
        );
      };

      this.showAnnSetTable.forEach((annotationSet) => {
        annotationSet.labels.forEach((label) => {
          if (!labelAlreadyExists(label) && label.annotations.length > 0) {
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

      this.showAnnSetTable.forEach((annotationSet) => {
        let row = {};
        let toAdd = false; // to not push empty labels

        annotationSet.labels.forEach((label) => {
          if (label.annotations.length > 0) {
            row[label.id] = label.annotations[0];
            this.orderedAnnotations.push(label.annotations[0]);
            toAdd = true;
          }
        });
        if (toAdd) {
          this.rows.push(row);
        }
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

    async changeLabel(column, label) {
      this.isLoading = true;
      this.closeDropdown(column);
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
      this.isLoading = false;
    },

    async deleteColumn(column) {
      this.isLoading = true;
      this.closeDropdown(column);

      const annotationsToDelete = [];
      for (let i = 0; i < this.rows.length; i++) {
        const annotationToDelete = this.rows[i][column.label.id];
        if (annotationToDelete && annotationToDelete.id) {
          annotationsToDelete.push(annotationToDelete);
        }
      }

      annotationsToDelete.forEach(async (annotationToDelete) => {
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
      });

      this.isLoading = false;
    },

    onDropdownChange(column, open) {
      this.editingLabels = [];
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("document/resetEditAnnotation");
      if (open) {
        if (
          this.openDropdown &&
          this.$refs[this.getDropdownReference(column)].length > 0
        ) {
          this.$refs[this.openDropdown][0].toggle();
        }
        this.openDropdown = this.getDropdownReference(column);
      } else {
        if (this.openDropdown === this.getDropdownReference(column)) {
          this.openDropdown = null;
        }
      }
    },

    closeDropdown(column) {
      if (
        this.openDropdown &&
        this.$refs[this.getDropdownReference(column)].length > 0
      ) {
        this.$refs[this.getDropdownReference(column)][0].toggle();
        this.openDropdown = null;
      }
    },

    columndragstart(payload) {
      this.draggingColumnIndex = payload.index;
      payload.event.dataTransfer.effectAllowed = "copy";
    },
    columndragover(payload) {
      payload.event.dataTransfer.dropEffect = "copy";
      payload.event.target.closest("th").classList.add("is-selected");
      payload.event.preventDefault();
    },
    columndragleave(payload) {
      payload.event.target.closest("th").classList.remove("is-selected");
      payload.event.preventDefault();
    },
    async columndrop(payload) {
      payload.event.target.closest("th").classList.remove("is-selected");
      const droppedOnColumnIndex = payload.index;

      const draggingColumn = this.columns[this.draggingColumnIndex];
      const droppedColumn = this.columns[droppedOnColumnIndex];

      await this.changeLabel(draggingColumn, droppedColumn.label);
      await this.changeLabel(droppedColumn, draggingColumn.label);
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_overlay.scss"
></style>
