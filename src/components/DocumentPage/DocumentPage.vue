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
    <AnnotationPopup
      v-if="!isSelecting && spanSelectionsForPage(page).length > 0"
      :spans="spanSelectionsForPage(page)"
      :container-width="scaledViewport.width"
      :container-height="scaledViewport.height"
      :page="page"
      @close="closePopups"
    />

    <div
      v-if="showAnnotationLabel"
      class="annotation-label"
      :style="getAnnotationLabelPosition(showAnnotationLabel)"
    >
      {{ showAnnotationLabel.labelName }}
    </div>

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
          <template v-if="searchResults.length > 0">
            <v-rect
              v-for="(bbox, index) in searchResults"
              :key="'sr' + index"
              :config="{
                ...selectionTextRect(bbox, bbox === currentSearchResultForPage),
              }"
            ></v-rect>
          </template>
          <v-group
            v-if="
              !categorizeModalIsActive || !publicView || !isDocumentReviewed
            "
            ref="entities"
          >
            <v-rect
              v-for="(entity, index) in scaledEntities(page.entities, page)"
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
              <v-group>
                <v-rect
                  v-if="!isAnnotationInEditMode(annotation.id)"
                  :config="annotationRect(bbox, annotation.id)"
                  @click="handleFocusedAnnotation(annotation)"
                  @mouseenter="onElementEnter(annotation, bbox)"
                  @mouseleave="onElementLeave"
                />
              </v-group>
            </template>
            <template
              v-if="annotation.metadata && annotation.metadata.checkbox"
            >
              <v-group>
                <v-rect
                  v-if="!isAnnotationInEditMode(annotation.id)"
                  :config="
                    annotationRect(
                      annotation.metadata.checkbox.bbox,
                      annotation.id
                    )
                  "
                  @click="handleFocusedAnnotation(annotation)"
                  @mouseenter="
                    onElementEnter(
                      annotation,
                      annotation.metadata.checkbox.bbox
                    )
                  "
                  @mouseleave="onElementLeave"
                />
              </v-group>
            </template>
          </template>
        </template>
      </v-layer>
      <v-layer>
        <template
          v-for="(span, index) in spanSelectionsForPage(page)"
          :key="index"
        >
          <span-selection :id="index" :span="span" :page="page" />
        </template>
        <template
          v-for="(span, index) in placeholderSelectionForPage(page)"
          :key="`${index}_placeholder`"
        >
          <placeholder-selection :span="span" :page="page" />
        </template>
        <template v-if="page.number === selectionPage">
          <box-selection :page="page" />
        </template>
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
import SpanSelection from "./SpanSelection";
import PlaceholderSelection from "./PlaceholderSelection";
import AnnotationPopup from "./AnnotationPopup";
import AnnSetTableOptions from "./AnnSetTableOptions";

export default {
  name: "DocumentPage",
  components: {
    BoxSelection,
    SpanSelection,
    PlaceholderSelection,
    AnnotationPopup,
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
    };
  },

  computed: {
    ...mapState("selection", [
      "selectedEntities",
      "spanSelection",
      "isSelecting",
    ]),
    ...mapState("display", [
      "scale",
      "categorizeModalIsActive",
      "searchEnabled",
      "currentPage",
      "showAnnSetTable",
    ]),
    ...mapState("document", [
      "documentAnnotationSelected",
      "recalculatingAnnotations",
      "selectedDocument",
      "publicView",
      "annotationId",
    ]),
    ...mapState("edit", ["editMode"]),
    ...mapGetters("display", [
      "visiblePageRange",
      "bboxToRect",
      "scaledEntities",
    ]),
    ...mapGetters("selection", [
      "isSelectionValid",
      "spanSelectionsForPage",
      "placeholderSelectionForPage",
    ]),
    ...mapGetters("document", [
      "getAnnotationsFiltered",
      "isAnnotationInEditMode",
      "isDocumentReadyToBeReviewed",
      "isDocumentReviewed",
      "labelOfAnnotation",
    ]),
    selectionPage() {
      return this.selection && this.selection.pageNumber;
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
     * A filtered version of `annotations` for the chosen page.
     * Include annotations that have *at least* one bbox in the page.
     * If the annotation's bboxes span multiple pages, each DocumentPage receives
     * it and only shows the ones that match the pageNumber.
     */
    pageAnnotations() {
      const annotations = [];
      if (this.getAnnotationsFiltered.annotations) {
        this.getAnnotationsFiltered.annotations.map((annotation) => {
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

    searchResults() {
      const results = this.$store.getters["display/searchResultsForPage"](
        this.page.number
      );
      return results;
    },

    currentSearchResultForPage() {
      return this.$store.getters["display/currentSearchResultForPage"](
        this.page.number
      );
    },
    showAnnotationLabel() {
      if (
        this.showFocusedAnnotation &&
        !this.isSelecting &&
        this.documentAnnotationSelected &&
        this.documentAnnotationSelected.labelName !== ""
      ) {
        return this.documentAnnotationSelected;
      } else {
        return null;
      }
    },
  },
  watch: {
    recalculatingAnnotations(newState) {
      if (!newState) {
        this.drawPage(true);
      }
    },
    scale() {
      this.closePopups();
    },

    page(newValue, oldValue) {
      if (newValue.image_url !== oldValue.image_url) {
        this.drawPage(true);
      }
    },
    searchEnabled(isEnabled) {
      if (isEnabled) {
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

      if (
        event.target.getParent() &&
        event.target.getParent().className === "Transformer" &&
        !event.target.name().includes("anchor")
      ) {
        // if we are editing a box then close popups
        this.closePopups();

        return;
      }

      // check if element and delegate to it
      if (
        event.target.name() === "entity" ||
        event.target.name() === "annotation" ||
        event.target.name() === "multiAnnBoxSelection" ||
        event.target.name() === "multiAnnBoxTransformer" ||
        event.target.name() === "multiAnnButton" ||
        event.target.name() === "boxSelection" ||
        event.target.name() === "boxTransformer" ||
        event.target.name().includes("spanSelection") ||
        event.target.name().includes("spanTransformer") ||
        event.target.name().includes("anchor")
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

    handleFocusedAnnotation(annotation) {
      this.$store.dispatch("document/setAnnotationId", annotation.id);
      this.closePopups();
    },

    handleClickedEntity(entity) {
      this.$store.dispatch("selection/entityClick", entity);
    },

    onElementEnter(annotation = null, span = null) {
      if (
        !this.categorizeModalIsActive &&
        !this.publicView &&
        !this.editMode &&
        !this.isDocumentReviewed
      ) {
        this.$refs.stage.$el.style.cursor = "pointer";
      }

      if (annotation) {
        const label = this.labelOfAnnotation(annotation);
        if (label) {
          this.$store.dispatch("document/setDocumentAnnotationSelected", {
            annotation,
            label,
            span,
            scrollTo: false,
          });
        }
      }
    },

    onElementLeave() {
      this.$refs.stage.$el.style.cursor = "inherit";
      this.$store.dispatch("document/disableDocumentAnnotationSelected");
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

    selectionTextRect(bbox, isFocused) {
      return {
        fill: isFocused ? "orange" : "greenyellow",
        stroke: isFocused ? "orange" : "",
        globalCompositeOperation: "multiply",
        ...this.bboxToRect(this.page, bbox),
      };
    },

    /**
     * Builds the konva config object for the entity.
     */
    entityRect(entity) {
      return {
        stroke: "#ccc",
        strokeWidth: 1,
        dash: [5, 2],
        fill: "transparent",
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
      const selected = this.annotationId == annotationId && !this.searchEnabled;
      const focused = this.isAnnotationFocused(annotationId);
      let fillColor = "yellow";
      let strokeWidth = 0;
      let strokeColor = "";

      // if annotation is selected
      if (selected) {
        fillColor = "orange";
        strokeWidth = 1;
        strokeColor = "black";
      } // if hovered
      else if (focused) {
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
    getAnnotationLabelPosition(annotation) {
      if (annotation && this.$refs.stage) {
        const maxCharacters = 10;
        const minimumSpaceTopY = 50;
        const rect = this.bboxToRect(this.page, annotation.span);

        if (
          annotation.labelName.length > maxCharacters &&
          rect.y < minimumSpaceTopY
        ) {
          return `left: ${rect.x}px; top: ${rect.y + rect.height}px`;
        } else {
          return `left: ${rect.x}px; bottom: ${
            this.$refs.stage.$el.clientHeight - rect.y
          }px`;
        }
      } else {
        return "";
      }
    },
    closePopups() {
      this.$store.dispatch("selection/entitySelection", {
        entities: [],
        selection: null,
      });
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_page.scss"></style>
