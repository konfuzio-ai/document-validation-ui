<template>
  <v-group>
    <v-rect ref="placeholderSelection" :config="placeholderConfig" />
  </v-group>
</template>

<script>
export default {
  props: {
    span: {
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
      return {
        x: this.span.x0,
        y: this.span.y0,
        width: this.span.x1 - this.span.x0,
        height: this.span.y1 - this.span.y0,
        fill: "transparent",
        stroke: "#41af85",
        strokeWidth: 3,
        globalCompositeOperation: "multiply",
        shadowForStrokeEnabled: false,
        name: "placeholderSelection",
        draggable: false,
      };
    },
  },
};
</script>
