<template>
  <div ref="pdfContainer" class="pdf-page-container">
    <NewAnnotation
      v-if="
        !publicView && newAnnotation && newAnnotation.length && !editAnnotation
      "
      :new-annotation="newAnnotation"
      :container-width="scaledViewport.width"
      :container-height="scaledViewport.height"
      @close="closePopups"
    />
    <MultiAnnotationTablePopup
      v-if="!publicView && tableSelection"
      :table-position="tableSelection.position"
      :page-size="scaledViewport"
      :label-set="tableSelection.labelSet"
      :grouped-entities="tableSelection.entities"
      @close="closePopups"
    />

    <v-stage
      v-if="image && scale"
      ref="stage"
      :config="scaledViewport"
      :style="canvasStyle"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
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
              @click="handleClickedEntity(entity)"
              @mouseenter="onElementEnter"
              @mouseleave="onElementLeave"
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
                :config="annotationRect(bbox, annotation.id)"
                @click="handleClickedAnnotation(annotation)"
                @mouseenter="onElementEnter"
                @mouseleave="onElementLeave"
              />
            </template>
          </template>
        </template>
      </v-layer>
      <v-layer v-if="showFocusedAnnotation && !isSelecting">
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
      </v-layer>
      <v-layer v-if="selection && isSelectionValid && isElementSelected">
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
      <v-layer v-else-if="selection && isSelectionValid && !tableSelection">
        <multi-ann-selection
          :page="page"
          @buttonEnter="onElementEnter"
          @buttonLeave="onElementLeave"
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
import MultiAnnSelection from "./MultiAnnSelection";
import NewAnnotation from "./NewAnnotation";
import MultiAnnotationTablePopup from "./MultiAnnotationTablePopup";

export default {
  name: "DocumentPage",
  components: {
    BoxSelection,
    MultiAnnSelection,
    NewAnnotation,
    MultiAnnotationTablePopup,
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
      newMultiAnnotationSetTable: null,
    };
  },

  computed: {
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
      return `width: ${width}px; height: ${height}px;`;
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
      "tableSelection",
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
    ...mapGetters("selection", [
      "isSelectionValid",
      "isElementSelected",
      "isEditingTable",
    ]),
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "isDocumentReadyToBeReviewed",
      "entitiesOnSelection",
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
      if (image && this.isSelecting) {
        this.$nextTick(() => {
          this.updateTransformer();
        });
      }
    },

    isSelecting(value) {
      if (value) {
        this.$nextTick(() => {
          this.updateTransformer();
        });
      }
    },
    scale() {
      this.closePopups();
    },
    selectedEntities(newValue) {
      if (!newValue) {
        this.closePopups();
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
        !this.isElementSelected &&
        annotationId === this.documentAnnotationSelected.id
      );
    },

    onMouseDown(event) {
      this.closePopups();
      // check if element and delegate to it
      if (
        event.target.name() === "entity" ||
        event.target.name() === "annotation" ||
        event.target.name() === "multiAnnBoxSelection" ||
        event.target.name() === "multiAnnBoxTransformer" ||
        event.target.name() === "multiAnnButton" ||
        (event.target.getParent() &&
          event.target.getParent().className === "Transformer")
      ) {
        return;
      }
      // if we click on a selection box, we should enable the transformer
      if (event.target.name() === "boxSelection") {
        this.updateTransformer();
        return;
      }

      // anything else, we start selecting

      const position = this.$refs.stage.getStage().getPointerPosition();
      this.startSelection({
        pageNumber: this.pageNumber,
        start: {
          x: position.x,
          y: position.y,
        },
      });
    },
    onMouseMove() {
      // if we are not editing, do nothing
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

    onMouseUp() {
      // if we are not editing, do nothing
      if (!this.isSelecting) {
        return;
      }

      const position = this.$refs.stage.getStage().getPointerPosition();
      this.endSelection({
        x: position.x,
        y: position.y,
      });

      if (this.isSelectionValid) {
        this.updateTransformer();
        if (this.isElementSelected) {
          this.getBoxSelectionContent();
        }
      }
    },

    handleClickedAnnotation(annotation) {
      this.closePopups();
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("document/setSidebarAnnotationSelected", annotation);
    },

    handleClickedEntity(entity) {
      this.$store.dispatch("selection/setTableSelection", null);
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

    onElementEnter() {
      this.$refs.stage.$el.style.cursor = "pointer";
    },

    onElementLeave() {
      this.$refs.stage.$el.style.cursor = "inherit";
    },

    handleMultiAnnSelectionFinished(newMultiAnnotationSetTable) {
      this.newMultiAnnotationSetTable = newMultiAnnotationSetTable;
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
      return {
        stroke: "#ccc",
        strokeWidth: 1,
        dash: [5, 2],
        fill:
          (this.newAnnotation && this.newAnnotation.entity === entity) ||
          (this.selectedEntity && this.selectedEntity === entity.original)
            ? "#67E9B7"
            : "transparent",
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
    annotationRect(bbox, annotationId, draggable) {
      const focused = this.isAnnotationFocused(annotationId);
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

    async getBoxSelectionContent() {
      const box = this.clientToBbox(
        this.page,
        this.selection.start,
        this.selection.end
      );
      this.$store.dispatch("selection/getTextFromBboxes", box);
    },
    closePopups() {
      this.newAnnotation = [];
      if (this.isEditingTable) {
        this.$store.dispatch("selection/disableSelection");
      }
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
