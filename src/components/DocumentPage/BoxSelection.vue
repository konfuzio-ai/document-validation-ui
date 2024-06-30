<template>
  <v-group>
    <v-rect
      v-if="isSelectionValid"
      ref="boxSelection"
      :config="config"
      :stroke-scale-enabled="false"
      @dragend="onChange"
      @transformend="onChange"
    />
    <v-transformer ref="boxTransformer" :config="transformerConfig" />
  </v-group>
</template>

<script>
import { mapGetters, mapState, mapActions } from "vuex";

export default {
  props: {
    page: {
      required: true,
      type: Object,
    },
  },
  computed: {
    /**
     * Konva options of the selection rectangle, based on the
     * `selection` object.
     */
    config() {
      return {
        x: this.selection.start.x,
        y: this.selection.start.y,
        width: this.selection.end.x - this.selection.start.x,
        height: this.selection.end.y - this.selection.start.y,
        fill: this.isSelecting ? "#7B61FFB3" : "transparent",
        stroke: this.isSelecting ? "transparent" : "#7B61FFB3",
        strokeWidth: 1,
        globalCompositeOperation: "multiply",
        shadowForStrokeEnabled: false,
        name: "boxSelection",
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
      };
    },
    ...mapState("selection", [
      "selection",
      "isSelecting",
      "elementSelected",
      "spanSelection",
    ]),
    ...mapGetters("display", ["clientToBbox"]),
    ...mapGetters("selection", ["isSelectionValid", "entitiesOnSelection"]),
  },
  watch: {
    isSelecting(isSelecting) {
      if (!isSelecting) {
        this.updateTransformer();
        this.handleSelection();
      }
    },
  },
  mounted() {
    if (!this.selection.custom) {
      // if annotation was selected, then add transformer
      this.updateTransformer();
    }
  },
  methods: {
    handleSelection() {
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
      const transformer = this.$refs.boxTransformer;

      // maybe we're out of sync and the transformer is not available, just return
      if (!transformer) {
        return;
      }

      const transformerNode = transformer.getNode();
      const stage = transformerNode.getStage();
      let selectedNode;
      if (stage) {
        selectedNode = stage.findOne(".boxSelection");
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
      if (!this.isSelecting) {
        const box = this.clientToBbox(
          this.page,
          this.selection.start,
          this.selection.end
        );
        this.$emit("selectEntities", this.entitiesOnSelection(box, this.page));
        this.$store.dispatch("selection/getTextFromBboxes", {
          box,
          entities: false,
        });
      }
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
      const node = this.$refs.boxSelection.getNode();
      node.skewX(0);
      node.skewY(0);
      node.rotation(0);
      node.scaleX(1);
      node.scaleY(1);

      this.handleSelection();
    },
    ...mapActions("selection", ["moveSelection"]),
  },
};
</script>
