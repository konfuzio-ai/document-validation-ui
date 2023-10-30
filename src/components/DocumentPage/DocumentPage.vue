<template>
  <div
    ref="pdfContainer"
    :class="[
      'pdf-page-container',
      (categorizeModalIsActive ||
        editMode ||
        publicView ||
        isDocumentReviewed) &&
        'default-cursor',
      page.number === currentPage && 'current-page',
    ]"
  >
    <NewAnnotation
      v-if="newAnnotation && newAnnotation.length && !editAnnotation"
      :new-annotation="newAnnotation"
      :container-width="scaledViewport.width"
      :container-height="scaledViewport.height"
      @close="closePopups"
    />

    <AnnSetTableOptions v-if="showAnnSetTable" :page="page" />

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
          <v-group v-if="!publicView || !isDocumentReviewed" ref="entities">
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
                @click="handleFocusedAnnotation(annotation, 'click')"
                @mouseenter="handleFocusedAnnotation(annotation)"
                @mouseleave="onElementLeave"
              />
            </template>
          </template>
        </template>
      </v-layer>
      <v-layer
        v-if="
          showFocusedAnnotation &&
          !isSelecting &&
          documentAnnotationSelected.labelName !== ''
        "
      >
        <v-label
          :key="`label${documentAnnotationSelected.id}`"
          :config="{
            listening: false,
            ...annotationLabelRect(documentAnnotationSelected.span),
          }"
        >
          <v-tag
            :config="{
              fill: '#1A1A1A',
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
      <v-layer v-if="isBoxSelection">
        <box-selection :page="page" />
      </v-layer>
      <v-layer v-else-if="isMultiSelection">
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
import { PIXEL_RATIO, MULTI_ANN_TABLE_FEATURE } from "../../constants";
import api from "../../api";
import BoxSelection from "./BoxSelection";
import MultiAnnSelection from "./MultiAnnSelection";
import NewAnnotation from "./NewAnnotation";
import AnnSetTableOptions from "./AnnSetTableOptions";

export default {
  name: "DocumentPage",
  components: {
    BoxSelection,
    MultiAnnSelection,
    NewAnnotation,
    AnnSetTableOptions,
  },

  props: {
    page: {
      type: Object,
      required: true,
    },
    imageBlob: {
      type: Blob,
      required: false,
      default: null,
    },
  },

  data() {
    return {
      image: null,
      newAnnotation: [],
    };
  },

  computed: {
    ...mapState("display", ["currentPage", "showAnnSetTable"]),
    ...mapGetters("document", ["isNegative"]),

    isBoxSelection() {
      return this.selection && !this.isSelecting && this.isElementSelected;
    },
    isMultiSelection() {
      return MULTI_ANN_TABLE_FEATURE && this.selection && this.isSelectionValid;
    },
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
            ) &&
            !this.isNegative(annotation)
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

    ...mapState("selection", ["isSelecting", "selectedEntities"]),
    ...mapState("display", ["scale", "categorizeModalIsActive"]),
    ...mapState("document", [
      "documentAnnotationSelected",
      "recalculatingAnnotations",
      "annotations",
      "editAnnotation",
      "selectedDocument",
      "publicView",
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("display", ["visiblePageRange", "bboxToRect"]),
    ...mapGetters("selection", ["isSelectionValid", "isElementSelected"]),
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "isDocumentReadyToBeReviewed",
      "entitiesOnSelection",
      "isDocumentReviewed",
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
    async selectedEntities(newValue) {
      if (!newValue) {
        this.$store.dispatch("selection/setSpanSelection", null);
        this.closePopups(true);
      }

      await this.$store.dispatch("selection/getTextFromEntities", newValue);
    },
    page(newValue, oldValue) {
      if (newValue.image_url !== oldValue.image_url) {
        this.drawPage(true);
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
      if (
        this.categorizeModalIsActive ||
        this.editMode ||
        this.publicView ||
        this.isDocumentReviewed
      )
        return;

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

    handleFocusedAnnotation(annotation, trigger) {
      this.$store.dispatch("document/setSidebarAnnotationSelected", {
        annotation,
        trigger,
      });

      if (trigger && trigger === "click") {
        this.closePopups(true);
      } else {
        this.onElementEnter();
      }
    },

    handleClickedEntity(entity) {
      if (
        !entity ||
        this.categorizeModalIsActive ||
        this.publicView ||
        this.isDocumentReviewed
      )
        return;

      // Check if we are creating a new Annotation
      // or if we are removing a previously selected entity
      // or editing empty one
      const entityToAdd = entity;

      const found = this.newAnnotation.find(
        (ann) =>
          ann.scaled.width === entityToAdd.scaled.width &&
          ann.original.offset_string === entityToAdd.original.offset_string
      );

      // reset the selection so that we don't have a drawn rectangle when editing based on entities
      this.endSelection();

      if (found) {
        this.newAnnotation = [
          ...this.newAnnotation.filter(
            (ann) =>
              ann.scaled.width !== entityToAdd.scaled.width &&
              ann.original.offset_string !== entityToAdd.original.offset_string
          ),
        ];
      } else {
        this.newAnnotation.push(entityToAdd);
      }

      if (this.newAnnotation.length > 0) {
        this.$store.dispatch(
          "selection/setSelectedEntities",
          this.newAnnotation
        );
      } else {
        this.$store.dispatch("selection/setSelectedEntities", null);
      }
    },

    onElementEnter() {
      if (
        !this.categorizeModalIsActive &&
        !this.publicView &&
        !this.editMode &&
        !this.isDocumentReviewed
      ) {
        this.$refs.stage.$el.style.cursor = "pointer";
      }
    },

    onElementLeave() {
      this.$refs.stage.$el.style.cursor = "inherit";
    },

    /**
     * Konva draws pages like this.
     */
    drawPage(force = false) {
      if (this.image && !force) {
        return;
      }
      if (process.env.NODE_ENV === "test") {
        return;
      }

      const convertBlob = (blob) => {
        const image = new Image();
        image.src = URL.createObjectURL(blob);
        image.onload = () => {
          // set image only when it is loaded
          this.image = image;
        };
      };

      if (!this.imageBlob) {
        api
          .makeFileRequest(
            `${this.page.image_url}?${this.selectedDocument.downloaded_at}`
          )
          .then((myBlob) => {
            convertBlob(myBlob);
          })
          .catch((error) => {});
      } else {
        convertBlob(this.imageBlob);
      }
    },

    /**
     * Builds the konva config object for the entity.
     */
    entityRect(entity) {
      let entityIsSelected = false;
      if (this.newAnnotation && this.newAnnotation.length > 0) {
        entityIsSelected = this.newAnnotation.find((selectedEntity) => {
          return (
            selectedEntity.original.offset_string ===
              entity.original.offset_string &&
            selectedEntity.original.x0 === entity.original.x0 &&
            selectedEntity.original.y0 === entity.original.y0
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
      if (closeNewAnnotaton) {
        this.newAnnotation = [];
      }
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
