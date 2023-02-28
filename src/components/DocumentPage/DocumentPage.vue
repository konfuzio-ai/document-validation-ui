<template>
  <div
    ref="pdfContainer"
    :class="[
      'pdf-page-container',
      categorizeModalIsActive || (editMode && 'pointer-cursor'),
    ]"
  >
    <NewAnnotation
      v-if="newAnnotation && newAnnotation.length && !editAnnotation"
      :new-annotation="newAnnotation"
      :container-width="scaledViewport.width"
      :container-height="scaledViewport.height"
      @close="closePopups"
    />
    <MultiAnnotationTablePopup
      v-if="newMultiAnnotationSetTable"
      :table-position="newMultiAnnotationSetTable.position"
      :page-size="scaledViewport"
      :label-set="newMultiAnnotationSetTable.labelSet"
      :grouped-entities="newMultiAnnotationSetTable.entities"
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
                (bbox) => bbox.page_index + 1 == page.number
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
      <v-layer v-if="selection && !isSelecting && isElementSelected">
        <box-selection :page="page" />
      </v-layer>
      <v-layer v-else-if="selection && isSelectionValid">
        <multi-ann-selection
          :page="page"
          @buttonEnter="onElementEnter"
          @buttonLeave="onElementLeave"
          @finished="handleMultiAnnSelectionFinished"
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
        this.documentAnnotationSelected.page === this.page.number &&
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
      return this.visiblePageRange.includes(this.page.number);
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
              (span) => span.page_index + 1 === this.page.number
            )
          ) {
            annotations.push(annotation);
          }
        });
      }
      return annotations;
    },

    selection() {
      return this.$store.getters["selection/getSelectionForPage"](
        this.page.number
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
      "categorizeModalIsActive",
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("display", ["visiblePageRange", "bboxToRect"]),
    ...mapGetters("selection", ["isSelectionValid", "isElementSelected"]),
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
    scale() {
      this.closePopups(true);
    },
    selectedEntities(newValue) {
      if (!newValue) {
        this.closePopups(true);
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
      if (this.categorizeModalIsActive || this.editMode) return;

      this.closePopups();

      // check if element and delegate to it
      if (
        event.target.name() === "entity" ||
        event.target.name() === "annotation" ||
        event.target.name() === "multiAnnBoxSelection" ||
        event.target.name() === "multiAnnBoxTransformer" ||
        event.target.name() === "multiAnnButton" ||
        event.target.name() === "boxSelection" ||
        event.target.name() === "boxTransformer" ||
        (event.target.getParent() &&
          event.target.getParent().className === "Transformer")
      ) {
        return;
      }
      if (this.publicView) {
        return;
      }

      // anything else, we start selecting

      const position = this.$refs.stage.getStage().getPointerPosition();
      this.startSelection({
        pageNumber: this.page.number,
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
    },

    handleClickedAnnotation(annotation) {
      this.closePopups(true);
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("document/setSidebarAnnotationSelected", annotation);
    },

    handleClickedEntity(entity) {
      if (!entity || this.categorizeModalIsActive) return;

      // Check if we are creating a new Annotation
      // or if we are editing an existing or empty one
      const entityToAdd = {
        entity,
        content: entity.original.offset_string,
      };

      const found = this.newAnnotation.find(
        (ann) =>
          ann.entity.scaled.width === entityToAdd.entity.scaled.width &&
          ann.content === entityToAdd.content
      );

      if (found) {
        this.newAnnotation = [
          ...this.newAnnotation.filter(
            (ann) =>
              ann.entity.scaled.width !== entityToAdd.entity.scaled.width &&
              ann.content !== entityToAdd.content
          ),
        ];
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
      if (!this.categorizeModalIsActive) {
        this.$refs.stage.$el.style.cursor = "pointer";
      }
    },

    onElementLeave() {
      this.$refs.stage.$el.style.cursor = "inherit";
    },

    handleMultiAnnSelectionFinished(newMultiAnnotationSetTable) {
      this.newMultiAnnotationSetTable = newMultiAnnotationSetTable;
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
      let entityIsSelected = false;
      if (this.newAnnotation) {
        entityIsSelected = this.newAnnotation.find((selectedEntity) => {
          return (
            selectedEntity.entity.original.offset_string ===
              entity.original.offset_string &&
            selectedEntity.entity.original.x0 === entity.original.x0 &&
            selectedEntity.entity.original.y0 === entity.original.y0
          );
        });
      }

      return {
        stroke: "#ccc",
        strokeWidth: 1,
        dash: [5, 2],
        fill: entityIsSelected ? "#67E9B7" : "transparent",
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
    closePopups(closeNewAnnotaton) {
      this.newMultiAnnotationSetTable = null;
      if (closeNewAnnotaton) {
        this.newAnnotation = [];
      }
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
