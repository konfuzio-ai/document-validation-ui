<template>
  <div :style="canvasStyle"></div>
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
    page: {
      type: Object,
      required: true
    }
  },

  computed: {
    actualSizeViewport() {
      return {
        width: this.page.size[0] * this.scale,
        height: this.page.size[1] * this.scale
      };
    },

    scaledViewport() {
      const { width: actualSizeWidth, height: actualSizeHeight } =
        this.actualSizeViewport;
      const [pixelWidth, pixelHeight] = [actualSizeWidth, actualSizeHeight].map(
        dim => Math.ceil(dim / PIXEL_RATIO)
      );
      return { width: pixelWidth, height: pixelHeight };
    },

    canvasStyle() {
      const { width, height } = this.scaledViewport;
      return `width: ${width}px; height: ${height}px; margin: 0 auto`;
    },

    ...mapState("display", ["scale"])
  }
};
</script>
