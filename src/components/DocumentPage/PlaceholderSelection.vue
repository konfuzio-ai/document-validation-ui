<template>
  <v-group>
    <v-rect ref="placeholderSelection" :config="placeholderConfig" />
  </v-group>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    span: {
      required: true,
      type: Object,
    },
    page: {
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
    placeholderConfig() {
      const box = this.bboxToRect(this.page, this.span);
      const primaryColor = window
        .getComputedStyle(document.body)
        .getPropertyValue("--primary-color");
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        fill: "transparent",
        stroke: primaryColor,
        strokeWidth: 3,
        globalCompositeOperation: "multiply",
        shadowForStrokeEnabled: false,
        name: "placeholderSelection",
        draggable: false,
      };
    },
    ...mapGetters("display", ["bboxToRect"]),
  },
};
</script>
