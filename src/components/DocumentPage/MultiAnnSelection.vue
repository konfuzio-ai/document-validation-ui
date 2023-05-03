<template>
  <v-group>
    <v-rect
      ref="multiAnnBoxSelection"
      :config="tableConfig"
      :stroke-scale-enabled="false"
      @dragstart="changeStart"
      @dragend="onChange"
      @transformstart="changeStart"
      @transformend="onChange"
    />
    <v-transformer ref="multiAnnBoxTransformer" :config="transformerConfig" />
    <v-label
      v-if="showButton"
      :config="buttonConfig"
      @mouseenter="onButtonEnter"
      @mouseleave="onButtonLeave"
    >
      <v-tag
        :config="{
          fill: '#7B61FF',
          cornerRadius: 4,
          name: 'tag',
        }"
      />
      <v-text
        :config="{
          align: 'right',
          width: buttonWidth,
          ellipsis: true,
          wrap: 'none',
          padding: 8,
          text: $t('new_multi_ann_title'),
          fill: 'white',
          fontSize: 14,
          cursor: 'pointer',
          name: 'multiAnnButton',
        }"
        @click="openMultiAnnotationModal"
      />
    </v-label>
  </v-group>
</template>

<script>
import { mapGetters, mapState, mapActions } from "vuex";
import { ChooseLabelSetModal } from "../DocumentAnnotations";
import { table_reference_api } from "../../store/document";

export default {
  props: {
    page: {
      required: true,
      type: Object,
    },
  },
  data() {
    const BUTTON_HEIGHT = 36;
    const BUTTON_WIDTH = this.$i18n.locale === "de" ? 238 : 187;
    return {
      buttonWidth: BUTTON_WIDTH,
      buttonHeight: BUTTON_HEIGHT,
      isEditing: false,
      showTable: false,
      entities: [],
    };
  },
  computed: {
    showButton() {
      return !this.isSelecting && !this.isEditing;
    },
    transformerConfig() {
      return {
        borderEnabled: false,
        rotateEnabled: false,
        ignoreStroke: true,
        keepRatio: false,
        anchorStroke: "#7B61FF",
        anchorSize: 6,
      };
    },
    tableConfig() {
      return {
        x: this.selection.start.x,
        y: this.selection.start.y,
        width: this.selection.end.x - this.selection.start.x,
        height: this.selection.end.y - this.selection.start.y,
        fill: this.isSelecting ? "#7B61FFB3" : "#7B61FF33",
        stroke: this.isSelecting ? "transparent" : "#7B61FFB3",
        strokeWidth: 1,
        globalCompositeOperation: "multiply",
        shadowForStrokeEnabled: false,
        name: "multiAnnBoxSelection",
        draggable: true,
      };
    },
    buttonConfig() {
      let x = this.selection.end.x;
      let y = this.selection.end.y;
      const marginTop = 4;

      // check if selection was made from right to left
      if (x < this.selection.start.x) {
        x = this.selection.start.x;
      }
      if (y < this.selection.start.y) {
        y = this.selection.start.y;
      }

      return {
        x: x - this.buttonWidth,
        y: y + marginTop,
        height: this.buttonHeight,
        width: this.buttonWidth,
      };
    },
    ...mapState("selection", ["selection", "isSelecting"]),
    ...mapState("document", ["documentId"]),
    ...mapGetters("display", ["clientToBbox"]),
    ...mapGetters("document", ["entitiesOnSelection"]),
  },
  watch: {
    isSelecting(newValue, oldValue) {
      // if it ends selection
      if (!newValue && oldValue) {
        this.calculateEntities();
        this.updateTransformer();
      }
    },
  },
  methods: {
    openMultiAnnotationModal() {
      this.$buefy.modal.open({
        parent: this.$parent,
        component: ChooseLabelSetModal,
        hasModalCard: true,
        trapFocus: true,
        canCancel: false,
        customClass: "dv-ui-theme invisible-parent-modal",
        props: { isMultipleAnnotations: true },
        events: {
          labelSet: this.submitAnnotations,
        },
      });
    },
    chooseLabelSet(labelSet) {
      const tableSelection = {
        labelSet,
        position: {
          x: this.selection.start.x,
          y: this.selection.start.y,
          width: this.selection.end.x - this.selection.start.x,
          height: this.selection.end.y - this.selection.start.y,
        },
        entities: this.entities,
      };
      this.$store.dispatch("selection/disableSelection");
      this.$emit("finished", tableSelection);
    },

    async submitAnnotations(labelSet) {
      const columns = labelSet.labels.map((label) => {
        return {
          field: `${label.id}`,
          label: label.name,
          centered: true,
        };
      });

      const orderedEntities = this.processRows(columns);

      const annotations = [];

      orderedEntities.forEach((orderedEntity) => {
        annotations.push({
          document: this.documentId,
          span: orderedEntity.spans,
          label: orderedEntity.label_id,
          is_correct: true,
          revised: false,
          label_set: labelSet.id,
          set_reference: orderedEntity.row_index,
          origin: table_reference_api,
        });
      });

      this.$store
        .dispatch("document/createAnnotation", annotations)
        .then(() => {
          this.$store.dispatch("selection/disableSelection");
          this.$emit("finished");
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("error_creating_multi_ann"),
          });
          this.$emit("finished");
        });
    },

    onButtonEnter() {
      this.$emit("buttonEnter");
    },

    onButtonLeave() {
      this.$emit("buttonLeave");
    },
    changeStart() {
      this.isEditing = true;
    },
    /**
     * This method is used for both transforms and drags since it just
     * retrieves the rect's new attributes from the event and uses those
     * to set the new selection state.
     */
    onChange(event) {
      this.isEditing = false;

      const { x, y, scaleX, scaleY, skewX, width, height } = event.target.attrs;
      const realWidth = width * scaleX;
      const realHeight = height * scaleY;
      let start;
      let end;

      // we need to figure out if there's skewing going on, to fix start/end points
      // (other cases appear to fix themselves automatically)
      if (skewX >= 0) {
        start = { x, y };
        end = {
          x: start.x + realWidth,
          y: start.y + realHeight,
        };
      } else {
        end = { x, y };
        start = { x: end.x - realWidth, y: end.y - realHeight };
      }

      this.moveSelection({ start, end });

      // reset node's everything after transform (we don't want to deal with that,
      // just with regular x/y/width/height)
      const node = this.$refs.multiAnnBoxSelection.getNode();
      node.skewX(0);
      node.skewY(0);
      node.rotation(0);
      node.scaleX(1);
      node.scaleY(1);

      this.calculateEntities();
      this.updateTransformer();
    },

    updateTransformer() {
      // here we need to manually attach or detach Transformer node
      const transformer = this.$refs.multiAnnBoxTransformer;

      // maybe we're out of sync and the transformer is not available, just return
      if (!transformer) {
        return;
      }

      const transformerNode = transformer.getNode();
      const stage = transformerNode.getStage();
      const selectedNode = stage.findOne(".multiAnnBoxSelection");

      // do nothing if selected node is already attached
      if (selectedNode === transformerNode.node()) {
        return;
      }

      if (selectedNode) {
        // attach to another node
        transformerNode.nodes([selectedNode]);
      } else {
        // remove transformer
        transformerNode.nodes([]);
      }

      transformerNode.getLayer().batchDraw();
    },

    calculateEntities() {
      const box = this.clientToBbox(
        this.page,
        this.selection.start,
        this.selection.end
      );
      const entities = this.entitiesOnSelection(box, this.page);

      const offset = 4;
      if (entities.length === 0) {
        return;
      }

      const rows = [...new Set(entities.map((o) => o["top"]))];
      rows.sort();

      let joinRow = 0;
      const jointRows = [];

      // group entities that are near each other on Y axis
      rows.forEach((row) => {
        if (row - joinRow > offset) {
          joinRow = row;
          jointRows.push(row);
        }
      });

      let cols = {};
      jointRows.forEach((row) => {
        const entityRow = [];
        entities.forEach((item) => {
          if (item.top === row || Math.abs(item.top - row) <= offset) {
            entityRow.push(item);
          }
        });
        entityRow.sort((a, b) => a.x0 - b.x0);

        const finalRow = {};
        let previousEntity = null;

        // group entities that are near each other on X axis
        entityRow.forEach((entity) => {
          let xGroup = entity.x0;
          if (previousEntity && previousEntity.x1 + offset > entity.x0) {
            // compare to previous one
            finalRow[previousEntity.xGroup].push(entity);
            xGroup = previousEntity.xGroup;
          } else {
            finalRow[entity.x0] = [entity];
          }
          previousEntity = entity;
          previousEntity.xGroup = xGroup;
        });

        cols[row] = finalRow;
      });

      this.entities = cols;
    },

    processRows(columns) {
      const orderedEntities = []; // this will match the order of entities in the table so we have a way of tracking them once we submit
      let rowIndex = 0;

      Object.entries(this.entities).forEach(([key, groupedEntity]) => {
        let row = null;
        columns.forEach((column, index) => {
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

            orderedEntities.push(customEntity);
          }
        });
        if (row !== null) {
          rowIndex++;
        }
      });
      return orderedEntities;
    },

    ...mapActions("selection", ["moveSelection"]),
  },
};
</script>
