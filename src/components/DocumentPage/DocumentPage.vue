<template>
  <div ref="pdfContainer" class="pdf-page-container">
    <NewAnnotation
      v-if="!publicView && newAnnotation.length && !editAnnotation"
      :new-annotation="newAnnotation"
      :container-width="scaledViewport.width"
      :container-height="scaledViewport.height"
      @close="closeNewAnnotation"
    />

    <v-stage
      v-if="image && scale"
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
          :config="{
            image,
            width: scaledViewport.width,
            height: scaledViewport.height,
            listening: false,
          }"
        />
        <template v-if="pageInVisibleRange && !editMode">
          <v-group v-if="!publicView" ref="entities">
            <v-rect
              v-for="(entity, index) in scaledEntities"
              :key="index"
              :config="entityRect(entity)"
              @mouseenter="(e) => getCursor(e)"
              @mouseleave="getCursor()"
              @click="handleClickedEntity(entity)"
            />
          </v-group>
          <template v-for="annotation in pageAnnotations">
            <template
              v-for="(bbox, index) in annotation.span.filter(
                (bbox) => bbox.page_index + 1 == pageNumber
              )"
            >
              <v-rect
                v-if="!isAnnotationInEditMode(annotation.id)"
                :key="'ann' + annotation.id + '-' + index"
                :config="
                  annotationRect(bbox, isAnnotationFocused(annotation.id))
                "
                @click="selectLabelAnnotation(annotation)"
                @mouseenter="onAnnotationHover(annotation)"
                @mouseleave="onAnnotationHover()"
              />
            </template>
          </template>
        </template>
      </v-layer>
      <v-layer v-if="showFocusedAnnotation && !isInSelectionMode">
        <template>
          <v-label
            :key="`label${documentAnnotationSelected.id}`"
            :config="{
              listening: false,
              ...annotationLabelRect(documentAnnotationSelected.span),
            }"
          >
            <v-tag
              :config="{
                fill: '#2B3545',
                lineJoin: 'round',
                hitStrokeWidth: 0,
                listening: false,
              }"
            />
            <v-text
              :config="{
                padding: 4,
                text: documentAnnotationSelected.labelName,
                fill: 'white',
                fontSize: 12,
                listening: false,
              }"
            />
          </v-label>
        </template>
      </v-layer>
      <v-layer v-if="isInSelectionMode">
        <box-selection @changed="getBoxSelectionContent" />
        <v-transformer
          ref="transformer"
          :anchor-size="6"
          anchor-stroke="#7B61FF"
          :border-enabled="false"
          :rotate-enabled="false"
          :ignore-stroke="true"
          :keep-ratio="false"
        />
      </v-layer>
    </v-stage>
    <b-skeleton
      v-else
      position="is-centered"
      :width="scaledViewport.width"
      :height="scaledViewport.height"
    />
  </div>
</template>
<script>
import { mapState, mapGetters, mapActions } from "vuex";
import { PIXEL_RATIO } from "../../constants";
import api from "../../api";
import BoxSelection from "./BoxSelection";
import NewAnnotation from "./NewAnnotation";

export default {
  name: "DocumentPage",
  components: {
    BoxSelection,
    NewAnnotation,
  },

  props: {
    page: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      image: null,
      newAnnotation: [],
    };
  },

  computed: {
    isInSelectionMode() {
      return this.isSelectionEnabled && this.selection && this.selection.end;
    },
    showFocusedAnnotation() {
      return (
        this.documentAnnotationSelected &&
        this.documentAnnotationSelected.page === this.pageNumber &&
        this.visiblePageRange.includes(this.documentAnnotationSelected.page) &&
        !this.isAnnotationInEditMode(this.documentAnnotationSelected.id)
      );
    },
    actualSizeViewport() {
      return {
        width: this.page.size[0] * this.scale,
        height: this.page.size[1] * this.scale,
      };
    },

    scaledViewport() {
      const { width: actualSizeWidth, height: actualSizeHeight } =
        this.actualSizeViewport;
      const [pixelWidth, pixelHeight] = [actualSizeWidth, actualSizeHeight].map(
        (dim) => dim / PIXEL_RATIO
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

      return this.page.entities.map((entity) => {
        const box = this.bboxToRect(this.page, entity);
        return {
          original: entity,
          scaled: {
            ...box,
          },
          clickSelected: false,
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
        this.annotations.map((annotation) => {
          if (
            annotation.span.find(
              (span) => span.page_index + 1 === this.pageNumber
            )
          ) {
            annotations.push(annotation);
          }
        });
      }
      return annotations;
    },

    pageNumber() {
      if (this.editMode) {
        return this.page.page_number;
      }
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
      "spanSelection",
    ]),
    ...mapState("display", ["scale", "optimalScale"]),
    ...mapState("document", [
      "documentAnnotationSelected",
      "recalculatingAnnotations",
      "annotations",
      "editAnnotation",
      "selectedDocument",
      "publicView",
      "selectedEntities",
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("display", [
      "visiblePageRange",
      "bboxToRect",
      "clientToBbox",
    ]),
    ...mapGetters("selection", ["isSelectionEnabled"]),
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "isDocumentReadyToBeReviewed",
    ]),
  },

  watch: {
    recalculatingAnnotations(newState) {
      if (!newState) {
        this.drawPage(true);
      }
    },
    // wait for the document image to be displayed to enable the selection transformer
    image(image) {
      if (image && this.isInSelectionMode) {
        this.$nextTick(() => {
          this.updateTransformer();
        });
      }
    },

    isInSelectionMode(value) {
      if (value) {
        this.$nextTick(() => {
          this.updateTransformer();
        });
      }
    },
    scale() {
      this.closeNewAnnotation();
    },
    selectedEntities(newValue) {
      if (!newValue) {
        this.closeNewAnnotation();
      }
    },
  },

  mounted() {
    if (
      this.selectedDocument &&
      this.selectedDocument.labeling_available === 1
    ) {
      this.drawPage();
    }
  },

  methods: {
    ...mapActions("selection", [
      "startSelection",
      "endSelection",
      "moveSelection",
    ]),
    isAnnotationFocused(annotationId) {
      return (
        this.documentAnnotationSelected &&
        !this.isSelectionEnabled &&
        annotationId === this.documentAnnotationSelected.id
      );
    },
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
          y: position.y,
        },
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
          y: position.y,
        },
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
        y: position.y,
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
      api.IMG_REQUEST.get(
        `${this.page.image_url}?${this.selectedDocument.downloaded_at}`
      )
        .then((response) => {
          return response.data;
        })
        .then((myBlob) => {
          image.src = URL.createObjectURL(myBlob);
          image.onload = () => {
            // set image only when it is loaded
            this.image = image;
          };
        });
    },

    /**
     * Builds the konva config object for the entity.
     */
    entityRect(entity) {
      if (!entity) return;

      let fillColor;

      if (this.newAnnotation.length) {
        this.newAnnotation.map((ann) => {
          if (ann.entity === entity) {
            fillColor = "#67E9B7";
          }
        });
      } else {
        fillColor = "transparent";
      }

      return {
        stroke: "#ccc",
        strokeWidth: 1,
        dash: [5, 2],
        fill: fillColor,
        globalCompositeOperation: "multiply",
        transformsEnabled: "position",
        hitStrokeWidth: 0,
        shadowForStrokeEnabled: false,
        perfectDrawEnabled: false,
        name: "entity",
        ...entity.scaled,
      };
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
        ...this.bboxToRect(this.page, bbox),
      };
    },

    /**
     * Builds the konva config object for the annotation label.
     */
    annotationLabelRect(bbox) {
      const rect = this.bboxToRect(this.page, bbox, true);
      return {
        x: rect.x,
        y: rect.y,
      };
    },

    selectLabelAnnotation(annotation) {
      this.closeNewAnnotation();
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("document/setSidebarAnnotationSelected", annotation);
    },

    onAnnotationHover(annotation = null) {
      // hack to change the cursor when hovering an annotation
      if (annotation) {
        this.$refs.stage.$el.style.cursor = "pointer";
      } else {
        this.$refs.stage.$el.style.cursor = this.isSelectionEnabled
          ? "crosshair"
          : "default";
        // Set the id back to null so that the annotation doesn't stay selected
        this.$store.dispatch("document/disableDocumentAnnotationSelected");
      }
    },

    async getBoxSelectionContent() {
      const box = this.clientToBbox(
        this.page,
        this.selection.start,
        this.selection.end
      );

      this.$store.dispatch("selection/getTextFromBboxes", box);
    },

    getCursor(e) {
      if (e) {
        const container = e.target.getStage().container();
        container.style.cursor = "pointer";
      } else {
        this.$refs.stage.$el.style.cursor = "crosshair";
      }
    },

    handleClickedEntity(entity) {
      if (!entity) return;

      // Check if we are creating a new Annotation
      // or if we are ediitng an existing or empty one

      const entityToAdd = {
        entity,
        content: entity.original.offset_string,
      };

      let found;

      if (this.newAnnotation) {
        found = this.newAnnotation.find(
          (ann) =>
            ann.entity.scaled.width === entityToAdd.entity.scaled.width &&
            ann.content === entityToAdd.content
        );
      }

      if (found) {
        this.newAnnotation = this.newAnnotation.filter(
          (ann) =>
            ann.entity.scaled.width !== entityToAdd.entity.scaled.width &&
            ann.content !== entityToAdd.content
        );
      } else {
        this.newAnnotation.push(entityToAdd);
      }

      if (this.newAnnotation.length > 0) {
        this.$store.dispatch(
          "document/setSelectedEntities",
          this.newAnnotation
        );
      } else {
        this.$store.dispatch("document/setSelectedEntities", null);
      }
    },

    closeNewAnnotation() {
      this.newAnnotation = [];
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
