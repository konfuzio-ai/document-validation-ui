<template>
  <div :style="canvasStyle">
    <b-skeleton
      :width="`${scaledViewport.width}px`"
      :height="`${scaledViewport.height}px`"
    />
  </div>
</template>

<script>
/**
 * This component is used to mimick an actual page's height/width to
 * act as a placeholder (mainly for scrolling) instead of rendering the
 * full page canvas when it's not needed (unfocused pages).
 */

import { mapState } from "vuex";
import { PIXEL_RATIO } from "../../constants";

export default {
  props: {
    width: {
      default: 0,
      type: Number,
    },
    height: {
      default: 0,
      type: Number,
    },
  },
  computed: {
    ...mapState("display", ["scale"]),
    actualSizeViewport() {
      return {
        width: this.width * this.scale,
        height: this.height * this.scale,
      };
    },

    scaledViewport() {
      const { width: actualSizeWidth, height: actualSizeHeight } =
        this.actualSizeViewport;
      const [pixelWidth, pixelHeight] = [actualSizeWidth, actualSizeHeight].map(
        (dim) => Math.ceil(dim / PIXEL_RATIO)
      );
      return { width: pixelWidth, height: pixelHeight };
    },

    canvasStyle() {
      const { width, height } = this.scaledViewport;
      return `width: ${width}px; height: ${height}px; margin: 0 auto`;
    },
  },
};
</script>
