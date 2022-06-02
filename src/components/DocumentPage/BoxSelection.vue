<template>
  <v-rect
    :config="config"
    :strokeScaleEnabled="false"
    ref="boxSelection"
    @dragend="onChange"
    @transformend="onChange"
    v-on="$listeners"
  ></v-rect>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
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
        stroke: "red",
        strokeWidth: 2,
        globalCompositeOperation: "multiply",
        shadowForStrokeEnabled: false,
        name: "boxSelection",
        draggable: true
      };
    },
    ...mapState("selection", ["selection", "isSelecting"])
  },
  methods: {
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
      // (other cases appear to fix themselevs automatically)
      if (skewX >= 0) {
        start = { x, y };
        end = {
          x: start.x + realWidth,
          y: start.y + realHeight
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

      // we emit this to PDFPage so that it can refresh the selection from the
      // backend once we're finished transforming/dragging
      this.$emit("changed");
    },
    ...mapActions("selection", ["moveSelection"])
  }
};
</script>
