<template>
  <div
    class="multi-ann-table-popup"
    :style="{
      left: `${tablePosition.x}px`,
      top: `${tablePosition.y - 22}px`,
      width: `${tablePosition.width}px`,
      height: `${tablePosition.height}px`,
      maxWidth: `${pageSize.width}px`,
      maxHeight: `${pageSize.height}px`,
    }"
  >
    <b-table
      ref="table"
      class="full-height"
      detail-icon="faScissors"
      :data="rows"
      :columns="columns"
      :narrowed="true"
      :bordered="true"
      draggable-column
      @columndragstart="columndragstart"
      @columndrop="columndrop"
      @columndragover="columndragover"
      @columndragleave="columndragleave"
    >
    </b-table>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "MultiAnnotationTablePopup",

  props: {
    tablePosition: {
      required: true,
      type: Object,
      default: null,
    },
    pageSize: {
      required: true,
      type: Object,
      default: null,
    },
    labelSet: {
      required: true,
      type: Object,
      default: null,
    },
    groupedEntities: {
      required: true,
      type: Object,
      default: null,
    },
  },
  data() {
    const columns = this.labelSet.labels.map((label) => {
      return {
        field: `${label.id}`,
        label: label.name,
        centered: true,
      };
    });
    return {
      rows: [],
      columns,
      counter: 0,
      draggingColumn: null,
      draggingColumnIndex: null,
      orderedEntities: [],
    };
  },
  computed: {
    ...mapState("document", ["documentId"]),
  },
  mounted() {
    this.handleRows();
    setTimeout(() => {
      // prevent click propagation when opening the popup
      document.body.addEventListener("click", this.clickOutside);
      this.$refs.table.$el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }, 200);

    // show action bar
    this.$store.dispatch("display/showDocumentActionBar", {
      show: true,
      text: this.$t("drag_drop_columns_multi_ann"),
      icon: "drag",
      loading: false,
      action: () => {
        this.submitAnnotations();
        this.$emit("close");
      },
    });
  },
  destroyed() {
    this.$store.dispatch("display/showDocumentActionBar", { show: false });
    this.$store.dispatch("selection/disableSelection");
    document.body.removeEventListener("click", this.clickOutside);
  },
  methods: {
    handleRows() {
      this.rows = [];
      this.orderedEntities = []; // this will match the order of entities in the table so we have a way of tracking them once we submit
      let rowIndex = 0;

      Object.entries(this.groupedEntities).forEach(([key, groupedEntity]) => {
        let row = null;
        this.columns.forEach((column, index) => {
          let spans = [];
          if (
            Object.entries(groupedEntity)[index] &&
            Object.entries(groupedEntity)[index].length > 0
          ) {
            spans = Object.entries(groupedEntity)[index][1];
          }
          const entityExists = spans.length > 0;

          let textContent = "";

          spans.forEach((entity) => {
            textContent = `${textContent} ${entity.offset_string}`;
          });

          row = {
            ...row,
            [column.field]: textContent,
          };
          if (entityExists) {
            const customEntity = {
              spans: [...spans],
              label_id: column.field,
              row_index: rowIndex,
            };

            this.orderedEntities.push(customEntity);
          }
        });
        if (row !== null) {
          rowIndex++;
        }
        this.rows.push(row);
      });
    },

    clickOutside(event) {
      if (!(this.$el == event.target || this.$el.contains(event.target))) {
        this.$emit("close");
      }
    },
    async submitAnnotations() {
      let errorMessageShown = false;
      let previousAnnotationSetId = null;
      let previousRowIndex = 0;

      this.$store.dispatch("display/showDocumentActionBar", {
        show: true,
        loading: false,
        action: true,
      });

      // traditional for to await for every request
      for (let i = 0; i < this.orderedEntities.length; i++) {
        const groupedEntity = this.orderedEntities[i];

        const annotationToCreate = {
          document: this.documentId,
          span: groupedEntity.spans,
          label: groupedEntity.label_id,
          is_correct: true,
          revised: false,
        };

        if (groupedEntity.row_index !== previousRowIndex) {
          // if line changed then reset annotation set
          previousAnnotationSetId = null;
        }
        previousRowIndex = groupedEntity.row_index;

        if (previousAnnotationSetId) {
          annotationToCreate.annotation_set = previousAnnotationSetId;
        } else {
          annotationToCreate.label_set = this.labelSet.id;
        }

        this.$store
          .dispatch("document/createAnnotation", annotationToCreate)
          .then((response) => {
            if (response) {
              // set ann set id to use on the next labels on the same row
              previousAnnotationSetId = response.data.annotation_set;
            }
          })
          .catch((error) => {
            if (!errorMessageShown) {
              this.$store.dispatch("document/createErrorMessage", {
                error,
                serverErrorMessage: this.$t("server_error"),
                defaultErrorMessage: this.$t("error_creating_multi_ann"),
              });

              // set to true to only show 1 error
              // the first time it appears
              errorMessageShown = true;
            }
          });
      }
      this.$emit("close");
    },
    deleteRow(index) {
      this.rows.splice(index, 1);
    },

    //#region Column Drag
    columndragstart(payload) {
      this.draggingColumn = payload.column;
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
    columndrop(payload) {
      payload.event.target.closest("th").classList.remove("is-selected");
      const droppedOnColumnIndex = payload.index;

      const column = this.columns[this.draggingColumnIndex];
      this.columns.splice(this.draggingColumnIndex, 1);
      this.columns.splice(droppedOnColumnIndex, 0, column);
      this.handleRows();
    },
    //#endregion
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_popup.scss"
></style>
