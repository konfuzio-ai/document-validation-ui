<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
<template>
  <div class="pdf-page-container">
    <v-stage
      v-if="scale"
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

        <template v-if="pageInVisibleRange && !editMode">
          <v-group ref="entities" v-if="showEntities">
            <v-rect
              v-for="(entity, index) in scaledEntities"
              :key="index"
              :config="{
                stroke: '#ccc',
                strokeWidth: 2,
                dash: [5, 2],
                fill: 'transparent',
                globalCompositeOperation: 'multiply',
                transformsEnabled: 'position',
                hitStrokeWidth: 0,
                shadowForStrokeEnabled: false,
                perfectDrawEnabled: false,
                name: 'entity',
                ...entity.scaled
              }"
              @mouseenter="cursor = 'pointer'"
              @mouseleave="cursor = 'crosshair'"
              @click="getEntitySelectionContent(entity)"
            ></v-rect>
          </v-group>
          <template v-for="annotation in pageAnnotations">
            <template
              v-for="(bbox, index) in annotation.span.filter(
                bbox => bbox.page_index + 1 == pageNumber
              )"
            >
              <v-rect
                v-if="!isAnnotationInEditMode(annotation.id)"
                :config="
                  annotationRect(
                    bbox,
                    documentFocusedAnnotation &&
                      annotation.id === documentFocusedAnnotation.id
                  )
                "
                :key="'ann' + annotation.id + '-' + index"
                @click="selectLabelAnnotation(annotation)"
                @mouseenter="onAnnotationHover(annotation)"
                @mouseleave="onAnnotationHover(null)"
              ></v-rect>
            </template>
          </template>
        </template>
      </v-layer>
      <v-layer v-if="showFocusedAnnotation">
        <template>
          <v-label
            :key="`label${documentFocusedAnnotation.id}`"
            :config="{
              listening: false,
              ...annotationLabelRect(documentFocusedAnnotation.span[0])
            }"
          >
            <v-tag
              :config="{
                fill: '#2B3545',
                lineJoin: 'round',
                hitStrokeWidth: 0,
                listening: false
              }"
            ></v-tag>
            <v-text
              :config="{
                padding: 4,
                text: documentFocusedAnnotation.label_name,
                fill: 'white',
                fontSize: 12,
                listening: false
              }"
            ></v-text>
          </v-label>
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
    }
  },

  data() {
    return {
      image: null,
      // TODO: remove this when annotation creation is implemented
      showEntities: false
    };
  },

  computed: {
    showFocusedAnnotation() {
      return (
        this.documentFocusedAnnotation &&
        this.documentFocusedAnnotation.span &&
        this.documentFocusedAnnotation.span[0].page_index + 1 ===
          this.pageNumber &&
        this.documentFocusedAnnotation.is_correct &&
        this.visiblePageRange.includes(
          this.documentFocusedAnnotation.span[0].page_index + 1
        ) &&
        !this.isAnnotationInEditMode(this.documentFocusedAnnotation.id)
      );
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
     * We take the entities from the backend and resize them according
     * to the `scale` (zoom), the `imageScale` (proportion between the original
     * document and the served image) and `PIXEL_RATIO` (in case of retina displays).
     * We also change the original bbox format to something that can be used with CSS.
     * The original is stored inside the `original` property, since it can be reused
     * when we're sending the entity to the backend for selection or saving.
     */
    scaledEntities() {
      // entities are either not loaded yet or empty
      if (!this.page.hasOwnProperty("entities") || !this.page.entities) {
        return [];
      }

      return this.page.entities.map(entity => {
        const box = this.bboxToRect(this.page, entity);
        return {
          original: entity,
          scaled: {
            ...box
          },
          clickSelected: false
        };
      });
    },

    /**
     * A filtered version of `annotations` for the chosen page.
     * Include annotations that have *at least* one bbox in the page.
     * If the annotation's bboxes span multiple pages, each DocumentPage receives
     * it and only shows the ones that match the pageNumber.
     */
    pageAnnotations() {
      const annotations = [];
      if (this.annotations) {
        this.annotations.map(annotation => {
          if (
            annotation.is_correct &&
            annotation.span.find(
              span => span.page_index + 1 === this.pageNumber
            )
          ) {
            annotations.push(annotation);
          }
        });
      }
      return annotations;
    },

    pageNumber() {
      return this.page.number;
    },

    selection() {
      return this.$store.getters["selection/getSelectionForPage"](
        this.pageNumber
      );
    },

    ...mapState("selection", [
      "isSelecting",
      "selectionFromBbox",
      "spanSelection"
    ]),
    ...mapState("display", ["currentPage", "scale", "optimalScale"]),
    ...mapState("document", [
      "documentFocusedAnnotation",
      "recalculatingAnnotations",
      "annotations",
      "editAnnotation",
      "selectedDocument"
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("display", [
      "visiblePageRange",
      "bboxToRect",
      "clientToBbox"
    ]),
    ...mapGetters("document", [
      "annotationsForPage",
      "pageCount",
      "annotationsInAnnotationSet",
      "isAnnotationInEditMode"
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

      if (!this.isSelecting) {
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

    async onMouseUp(event) {
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

    /**
     * Konva draws pages like this.
     */
    drawPage(force = false) {
      if (this.image && !force) {
        return;
      }
      const image = new Image();
      api.IMG_REQUEST.get(`${this.page.image_url}?${this.page.updated_at}`)
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
     * Builds the konva config object for the annotation.
     */
    annotationRect(bbox, focused, draggable) {
      let fillColor = "yellow";
      let strokeWidth = 0;
      let strokeColor = "";

      // if hovered
      if (focused) {
        fillColor = "#67E9B7";
        strokeWidth = 1;
        strokeColor = "black";
      }
      return {
        fill: fillColor,
        globalCompositeOperation: "multiply",
        strokeWidth: strokeWidth,
        stroke: strokeColor,
        name: "annotation",
        draggable,
        ...this.bboxToRect(this.page, bbox)
      };
    },
    /**
     * Builds the konva config object for the annotation label.
     */
    annotationLabelRect(bbox) {
      const rect = this.bboxToRect(this.page, bbox, true);
      return {
        x: rect.x,
        y: rect.y
      };
    },
    selectLabelAnnotation(annotation) {
      this.$store.dispatch("document/setSidebarAnnotationSelected", annotation);
    },

    onAnnotationHover(annotation) {
      // hack to change the cursor when hovering an annotation
      if (annotation) {
        this.$refs.stage.$el.style.cursor = "pointer";
      } else {
        this.$refs.stage.$el.style.cursor = this.isSelectionEnabled
          ? "crosshair"
          : "default";
        // Set the id back to null so that the annotation doesn't stay selected
        this.$store.dispatch(
          "document/setDocumentFocusedAnnotation",
          annotation
        );
      }
    },

    async getBoxSelectionContent() {
      const box = this.clientToBbox(
        this.page,
        this.selection.start,
        this.selection.end
      );
      this.$store.dispatch("document/startLoading");
      await this.$store.dispatch("selection/getTextFromBboxes", box);
      this.$store.dispatch("document/endLoading");
    },

    async getEntitySelectionContent(entity) {
      this.$store.dispatch("document/startLoading");
      await this.$store.dispatch(
        "selection/getTextFromBboxes",
        entity.original
      );
      //alert(this.spanSelection.offset_string);
      this.$store.dispatch("document/endLoading");
    }
  },
  watch: {
    recalculatingAnnotations(newState) {
      if (!newState) {
        this.drawPage(true);
      }
    },
    editAnnotation(annotation) {
      if (annotation) {
        setTimeout(() => {
          this.updateTransformer();
        }, 100);
      }
    },
    page() {
      if (this.selectedDocument.labeling_available === 1) {
        this.drawPage(true);
      }
    },
    selectedDocument(newValue) {
      if (newValue.labeling_available === 1) {
        this.drawPage(true);
      }
    }
  },
  mounted() {
    if (
      this.selectedDocument &&
      this.selectedDocument.labeling_available === 1
    ) {
      this.drawPage();
    }
  }
};
</script>
