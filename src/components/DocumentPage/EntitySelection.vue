<template>
  <v-group>
    <v-rect
      ref="entitySelection"
      :config="config"
      :stroke-scale-enabled="false"
      @dragend="onChange"
      @transformend="onChange"
    />
    <v-transformer
      v-if="!isSelectionValid"
      ref="entityTransformer"
      :config="transformerConfig"
    />
  </v-group>
</template>

<script>
import { mapGetters, mapState } from "vuex";

export default {
  props: {
    id: {
      required: true,
      type: Number,
    },
    page: {
      required: true,
      type: Object,
    },
    entity: {
      required: true,
      type: Object,
    },
  },
  data() {
    return {
      selection: {
        start: null,
        end: null,
      },
    };
  },
  computed: {
    /**
     * Konva options of the selection rectangle, based on the
     * `selection` object.
     */
    config() {
      const primaryColor = window
        .getComputedStyle(document.body)
        .getPropertyValue("--primary-color");
      return {
        x: this.entity.x,
        y: this.entity.y,
        width: this.entity.width,
        height: this.entity.height,
        stroke: "#7B61FFB3",
        fill: `${primaryColor}77`,
        strokeWidth: 1,
        globalCompositeOperation: "multiply",
        shadowForStrokeEnabled: false,
        perfectDrawEnabled: false,
        name: `entitySelection_${this.id}`,
        draggable: true,
      };
    },
    transformerConfig() {
      return {
        borderEnabled: false,
        rotateEnabled: false,
        ignoreStroke: true,
        keepRatio: false,
        anchorStroke: "#7B61FF",
        anchorSize: 6,
        name: `entityTransformer_${this.id}`,
      };
    },
    ...mapGetters("display", ["clientToBbox", "bboxToRect"]),
    ...mapGetters("selection", ["entitiesOnSelection", "isSelectionValid"]),
  },
  mounted() {
    this.setSelection();
    this.$nextTick(() => {
      this.updateTransformer();
    });
    console.log("box selections", this.selection);
  },
  methods: {
    setSelection() {
      this.selection = {
        start: {
          x: this.entity.x,
          y: this.entity.y,
        },
        end: {
          x: this.entity.x + this.entity.width,
          y: this.entity.y + this.entity.height,
        },
      };
    },
    startSelection(start) {
      this.selection.start = start;
    },

    moveSelection(points) {
      // only apply when we have a large enough selection, otherwise we risk counting misclicks
      const xDiff = Math.abs(this.selection.start.x - points.end.x);
      const yDiff = Math.abs(this.selection.start.y - points.end.y);
      if (xDiff > 5 && yDiff > 5) {
        const { start, end } = points;
        if (start) {
          this.selection.start = start;
        }
        if (end) {
          this.selection.end = end;
        }
      }
    },

    endSelection(end) {
      let xDiff;
      let yDiff;

      if (end) {
        xDiff = Math.abs(this.selection.start.x - end.x);
        yDiff = Math.abs(this.selection.start.y - end.y);
      }

      // if "end" is not provided, start and end points are the same, or if we have a selection smaller than 5x5,
      // just reset
      if (
        !end ||
        (yDiff <= 5 && xDiff <= 5) ||
        (this.selection.start.x === end.x && this.selection.start.y == end.y)
      ) {
        this.selection.start = null;
        this.selection.end = null;
      } else {
        this.selection.start.x = this.selection.start.x - selectionPadding;
        this.selection.start.y = this.selection.start.y - selectionPadding;

        end.x = end.x + selectionPadding;
        end.y = end.y + selectionPadding;

        this.selection.end = end;
      }
    },
    handleSelection() {
      console.log("handleSelection");
      if (!this.elementSelected) {
        const box = this.clientToBbox(
          this.page,
          this.selection.start,
          this.selection.end
        );
        this.$emit(
          "createAnnotations",
          this.entitiesOnSelection(box, this.page)
        );
      } else {
        this.getBoxSelectionContent();
      }
    },
    updateTransformer() {
      // here we need to manually attach or detach Transformer node
      const transformer = this.$refs.entityTransformer;

      // maybe we're out of sync and the transformer is not available, just return
      if (!transformer) {
        return;
      }

      const transformerNode = transformer.getNode();
      const stage = transformerNode.getStage();
      let selectedNode;
      if (stage) {
        selectedNode = stage.findOne(`.entitySelection_${this.id}`);
      }

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

    getBoxSelectionContent() {
      const box = this.clientToBbox(
        this.page,
        this.selection.start,
        this.selection.end
      );
      this.$emit("selectEntities", this.entitiesOnSelection(box, this.page));
    },

    /**
     * This method is used for both transforms and drags since it just
     * retrieves the rect's new attributes from the event and uses those
     * to set the new selection state.
     */
    onChange(event) {
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
      const node = this.$refs.entitySelection.getNode();
      node.skewX(0);
      node.skewY(0);
      node.rotation(0);
      node.scaleX(1);
      node.scaleY(1);

      this.handleSelection();
    },
  },
};
</script>
