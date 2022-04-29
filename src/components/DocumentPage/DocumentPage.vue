<template>
  <div class="pdf-page-container">
    <v-stage ref="stage" :config="scaledViewport" :style="canvasStyle">
      <v-layer>
        <v-image
          v-if="image"
          :config="{
            image,
            width: scaledViewport.width,
            height: scaledViewport.height,
            listening: false
          }"
        />

        <template v-if="pageInVisibleRange">
          <template v-for="annotation in pageAnnotations">
            <v-rect
              v-for="(bbox, index) in annotation.span.filter(
                bbox => bbox.page_index + 1 == pageNumber
              )"
              :key="'ann' + annotation.id + '-' + index"
              v-on:click="selectLabelAnnotation(annotation)"
              @mouseenter="onAnnotationHover(annotation, activeAnnotationSet)"
              @mouseleave="onAnnotationHover(null)"
              :config="
                setActiveLabelAnnotations(annotation, activeAnnotationSet, bbox)
              "
            ></v-rect>
          </template>
        </template>
      </v-layer>
    </v-stage>
  </div>
</template>

<script>
import BigNumber from "bignumber.js";
import { mapState, mapGetters } from "vuex";

import { PIXEL_RATIO } from "../../constants";

export default {
  name: "DocumentPage",

  props: {
    page: {
      type: Object,
      required: true
    },
    isPageFocused: {
      type: Boolean,
      default: false
    },
    isElementFocused: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      image: null,
      hoveredAnnotation: false,
      hoveredId: null
    };
  },

  computed: {
    /**
     * The proportion between the original size of the page and the
     * image rendering.
     */
    imageScale() {
      return new BigNumber(this.page.size[0])
        .div(this.page.original_size[0])
        .toNumber();
    },

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
        dim => dim / PIXEL_RATIO
      );
      return { width: pixelWidth, height: pixelHeight };
    },

    canvasStyle() {
      const { width, height } = this.scaledViewport;
      return `width: ${width}px; height: ${height}px; margin: 0 auto`;
    },

    pageInVisibleRange() {
      return this.visiblePageRange.includes(this.pageNumber);
    },

    /**
     * Filters the `annotations` object to retrieve just the ones for this page.
     */
    pageAnnotations() {
      return this.annotationsForPage(this.pageNumber);
    },

    pageNumber() {
      return this.page.pageNumber;
    },

    ...mapState("display", ["currentPage", "scale", "optimalScale"]),
    ...mapState("document", ["focusedAnnotation"]),
    ...mapGetters("display", ["visiblePageRange"]),
    ...mapGetters("document", ["annotationsForPage", "pageCount"]),
    ...mapGetters("sidebar", {
      annotationsInLabelSet: "annotationsInLabelSet"
    }),
    ...mapState("sidebar", ["activeAnnotationSet"])
  },

  methods: {
    focusPage() {
      if (this.isPageFocused) return;

      this.$store.dispatch("display/updateCurrentPage", this.pageNumber);

      this.annotationsInLabelSet(this.activeAnnotations);
    },

    /**
     * Konva draws pages like this.
     */
    drawPage() {
      if (this.image) {
        return;
      }
      const image = new window.Image();
      image.src = this.page.image;
      image.onload = () => {
        // set image only when it is loaded
        this.image = image;
      };
    },

    bboxToRect(bbox) {
      const { x0, x1, y0, y1, top } = bbox;
      const rect = {
        // left
        x: new BigNumber(x0)
          .times(this.scale)
          .times(this.imageScale)
          .div(PIXEL_RATIO)
          .toNumber(),
        // top
        y: new BigNumber(top)
          .times(this.scale)
          .times(this.imageScale)
          .div(PIXEL_RATIO)
          .toNumber(),
        width: new BigNumber(x1)
          .minus(x0)
          .abs()
          .times(this.scale)
          .times(this.imageScale)
          .div(PIXEL_RATIO)
          .toNumber(),
        height: new BigNumber(y1)
          .minus(y0)
          .times(this.scale)
          .times(this.imageScale)
          .div(PIXEL_RATIO)
          .toNumber()
      };
      return rect;
    },

    /**
     * Builds the konva config object for the annotation.
     */

    setActiveLabelAnnotations(annotation, activeAnnotationSet, bbox) {
      const annotationName = annotation.annotation_set.label_set.name;
      const activeSetName = activeAnnotationSet.group[0].label_set.name;
      let fillColor = window.annotationColor || "yellow";

      // if activeSet
      if (annotationName === activeSetName) {
        fillColor = "#67E9B7";
      }

      // if hovered
      if (annotation.id === this.hoveredId) {
        fillColor = "";
      }

      // Highlight with green the annotations from the active label set
      if (this.hoveredAnnotation) {
        /** If we are hovering over an annotation from the active label set,
         * we change the style
         */
        return {
          fill: fillColor,
          globalCompositeOperation: "multiply",
          hitStrokeWidth: annotation.id === this.hoveredId ? 2 : 0,
          stroke: annotation.id === this.hoveredId ? "#67E9B7" : "",
          name: "annotation",
          ...this.bboxToRect(bbox)
        };
      } else {
        return {
          fill: fillColor,
          globalCompositeOperation: "multiply",
          hitStrokeWidth: 0,
          name: "annotation",
          ...this.bboxToRect(bbox)
        };
      }
    },

    /**
     * Builds the konva config object for the annotation label.
     */
    annotationLabelRect(bbox, hasOffset = false) {
      return {
        y: (bbox.top * this.scale * this.imageScale) / PIXEL_RATIO - 16,
        x: (bbox.x0 * this.scale * this.imageScale) / PIXEL_RATIO - 1,
        offsetX: hasOffset ? -30 : 0
      };
    },
    selectLabelAnnotation(annotation) {
      this.$store.dispatch("document/setFocusedAnnotation", {
        id: annotation.id
      });
      this.$store.dispatch("sidebar/setAnnotationSelected", annotation);
    },

    onAnnotationHover(annotation, activeAnnotationSet) {
      // hack to change the cursor when hovering an annotation
      if (annotation) {
        this.$refs.stage.$el.style.cursor = "pointer";

        // Check if the current annotation belongs to the active set
        // Get all the labels from all groups in one array
        const activeAnnotationSetArray = activeAnnotationSet.group.flatMap(
          group => group.labels
        );

        let found = false;

        for (let i = 0; i < activeAnnotationSetArray.length; i++) {
          if (found) {
            break;
          }

          if (activeAnnotationSetArray[i].annotations.length === 0) {
            continue;
          } else {
            // We loop over the existing annotations:
            for (
              let j = 0;
              j < activeAnnotationSetArray[i].annotations.length;
              j++
            ) {
              if (
                annotation.id === activeAnnotationSetArray[i].annotations[j].id
              ) {
                this.hoveredAnnotation = true;
                this.hoveredId = activeAnnotationSetArray[i].annotations[j].id;
                found = true;

                // Highlight the active annotation on the sidebar on hover
                this.selectLabelAnnotation(annotation);
              }
            }
          }
        }
      } else {
        this.$refs.stage.$el.style.cursor = "default";
        this.hoveredAnnotation = false;
        this.hoveredId = null;
      }
    }
  },

  mounted() {
    this.drawPage();
  }
};
</script>
