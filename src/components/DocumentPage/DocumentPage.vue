<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
<template>
  <div class="pdf-page-container">
    <v-stage
      ref="stage"
      :config="scaledViewport"
      :style="canvasStyle"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
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
              :config="
                setActiveLabelAnnotations(annotation, activeAnnotationSet, bbox)
              "
              :key="'ann' + annotation.id + '-' + index"
              v-on:click="selectLabelAnnotation(annotation)"
              @mouseenter="onAnnotationHover(annotation, activeAnnotationSet)"
              @mouseleave="onAnnotationHover(null)"
            ></v-rect>
          </template>
        </template>
      </v-layer>
      <v-layer v-if="isSelectionEnabled && selection && selection.end">
        <box-selection
          @changed="getBoxSelectionContent"
          @mouseenter="cursor = 'grab'"
          @mouseleave="cursor = 'crosshair'"
        ></box-selection>
        <v-transformer
          ref="transformer"
          :anchorSize="6"
          anchorStroke="#7B61FF"
          :borderEnabled="false"
          :rotateEnabled="false"
          :ignoreStroke="true"
          :keepRatio="false"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script>
import BigNumber from "bignumber.js";
import { mapState, mapGetters, mapActions } from "vuex";
import { PIXEL_RATIO } from "../../constants";
import api from "../../api";
import BoxSelection from "./BoxSelection";

export default {
  name: "DocumentPage",
  components: {
    BoxSelection
  },

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
      return this.page.number;
    },

    selection() {
      return this.$store.getters["selection/getSelectionForPage"](
        this.pageNumber
      );
    },

    selectionFromBbox() {
      return this.$store.getters["selection/getSelectionFromBboxForPage"](
        this.pageNumber
      );
    },
    ...mapState("selection", ["isSelecting"]),
    ...mapState("display", ["currentPage", "scale", "optimalScale"]),
    ...mapState("document", ["focusedAnnotation", "activeAnnotationSet"]),
    ...mapGetters("display", ["visiblePageRange"]),
    ...mapGetters("document", [
      "annotationsForPage",
      "pageCount",
      "annotationsInLabelSet"
    ]),
    ...mapGetters("selection", ["isSelectionEnabled"])
  },

  methods: {
    ...mapActions("selection", [
      "startSelection",
      "endSelection",
      "moveSelection"
    ]),
    /**
     * Create bounding boxes
     */
    onMouseDown(event) {
      // if we are not editing, do nothing
      if (!this.isSelectionEnabled) {
        return;
      }

      // if we click on the transformer, it should delegate to it
      if (
        event.target.getParent() &&
        event.target.getParent().className === "Transformer"
      ) {
        return;
      }
      // if we click on a selection box, we should enable the transformer
      if (event.target.name() === "boxSelection") {
        this.updateTransformer();
        return;
      }
      const position = this.$refs.stage.getStage().getPointerPosition();
      this.startSelection({
        pageNumber: this.pageNumber,
        start: {
          x: position.x,
          y: position.y
        }
      });
    },
    onMouseMove(event) {
      // if we are not editing, do nothing
      if (!this.isSelectionEnabled) {
        return;
      }

      // show cursor lines
      if (!this.isSelecting) {
        // const scrollingDocumentEl =
        //   document.getElementById("scrollingDocument");
        // const cursorEl = document.getElementById("cursor");

        // var rect = scrollingDocumentEl.getBoundingClientRect();
        // var x = event.clientX + scrollingDocumentEl.scrollLeft - rect.left;
        // var y = event.clientY + scrollingDocumentEl.scrollTop - rect.top;
        // cursorEl.setAttribute("style", "top: " + y + "px; left: " + x + "px;");
        return;
      }

      const position = this.$refs.stage.getStage().getPointerPosition();
      this.moveSelection({
        end: {
          x: position.x,
          y: position.y
        }
      });
    },

    onMouseUp(event) {
      // if we are not editing, do nothing
      if (!this.isSelectionEnabled) {
        return;
      }
      if (!this.isSelecting) {
        return;
      }

      const position = this.$refs.stage.getStage().getPointerPosition();
      this.endSelection({
        x: position.x,
        y: position.y
      });

      /**
       * `endSelection` will reset everything in case of invalid selection.
       * Check the existance of `selection.end` before requesting the
       * content from the backend.
       * */
      if (this.selection && this.selection.end) {
        this.updateTransformer();
        this.getBoxSelectionContent();
      }
    },
    onMouseEnter() {
      // if we are not editing, do nothing
      if (!this.isSelectionEnabled) {
        return;
      }
      this.$refs.stage.$el.style.cursor = "crosshair";
    },
    onMouseLeave() {
      // if we are not editing, do nothing
      if (!this.isSelectionEnabled) {
        return;
      }
      this.$refs.stage.$el.style.cursor = "auto";
      // document.getElementById("cursor").removeAttribute("style");
    },

    updateTransformer() {
      // here we need to manually attach or detach Transformer node
      const transformer = this.$refs.transformer;

      // maybe we're out of sync and the transformer is not available, just return
      if (!transformer) {
        return;
      }

      const transformerNode = transformer.getNode();
      const stage = transformerNode.getStage();
      const selectedNode = stage.findOne(".boxSelection");

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
      const image = new Image();
      api.IMG_REQUEST.get(this.page.image_url)
        .then(response => {
          return response.data;
        })
        .then(myBlob => {
          image.src = URL.createObjectURL(myBlob);
          image.onload = () => {
            // set image only when it is loaded
            this.image = image;
          };
        });
    },

    /**
     * Transform the `position` coordinates into the bbox format accepted by
     * the backend.
     */
    clientToBbox(start, end) {
      /**
       * The backend bbox's `y0` and `y1` attributes depend on knowing the
       * page's height.
       */
      const pageHeight = new BigNumber(this.page.original_size[1]);

      /**
       * We use `Math.min` and `Math.max` because depending on how the area
       * selection is made the `start` and `end` attributes might be reversed.
       */
      const x0 = new BigNumber(Math.min(start.x, end.x))
        .div(this.scale)
        .div(this.imageScale)
        .times(PIXEL_RATIO)
        .dp(3, BigNumber.ROUND_DOWN)
        .toNumber();
      const x1 = new BigNumber(Math.max(start.x, end.x))
        .div(this.scale)
        .div(this.imageScale)
        .times(PIXEL_RATIO)
        .dp(3, BigNumber.ROUND_UP)
        .toNumber();
      const top = new BigNumber(Math.min(start.y, end.y))
        .div(this.scale)
        .div(this.imageScale)
        .times(PIXEL_RATIO)
        .dp(3)
        .toNumber();
      const bottom = new BigNumber(Math.max(start.y, end.y))
        .div(this.scale)
        .div(this.imageScale)
        .times(PIXEL_RATIO)
        .dp(3)
        .toNumber();
      const y0 = pageHeight
        .minus(bottom)
        .dp(3, BigNumber.ROUND_DOWN)
        .toNumber();
      const y1 = pageHeight.minus(top).dp(3, BigNumber.ROUND_UP).toNumber();

      const bbox = {
        x0,
        x1,
        top,
        bottom,
        y0,
        y1,
        page_index: this.pageNumber - 1
      };
      return bbox;
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
      let strokeWidth = 0;
      let strokeColor = "";

      // if activeSet
      if (annotationName === activeSetName) {
        fillColor = "#67E9B7";
      }

      // if hovered
      if (
        annotation.id === this.hoveredId ||
        annotation.id === this.focusedAnnotation.id
      ) {
        fillColor = "";
        strokeWidth = 2;
        strokeColor = "#67E9B7";
      }

      // Highlight with green the annotations from the active label set
      if (this.hoveredAnnotation || this.focusedAnnotation) {
        /** If we are hovering over an annotation from the active label set,
         * we change the style
         */
        return {
          fill: fillColor,
          globalCompositeOperation: "multiply",
          hitStrokeWidth: strokeWidth,
          stroke: strokeColor,
          name: "annotation",
          ...this.bboxToRect(bbox)
        };
      } else {
        return {
          fill: fillColor,
          globalCompositeOperation: "multiply",
          hitStrokeWidth: strokeWidth,
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
      this.$store.dispatch("document/setAnnotationSelected", annotation);
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
        // Set the id back to null so that the annotation doesn't stay selected
        this.$store.dispatch("document/setFocusedAnnotation", {
          id: null
        });
      }
    },
    async getBoxSelectionContent() {
      const box = this.clientToBbox(this.selection.start, this.selection.end);
      this.$store.dispatch("document/startLoading");
      await this.$store.dispatch("selection/getTextFromBboxes", box);
      this.$store.dispatch("document/endLoading");
    }
  },

  mounted() {
    this.drawPage();
  }
};
</script>
