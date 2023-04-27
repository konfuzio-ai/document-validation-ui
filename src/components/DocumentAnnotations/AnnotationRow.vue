<template>
  <div
    :class="[
      'annotation-row',
      isSelected && 'selected',
      hoverEmptyLabelRows && 'hovered-empty-labels',
      hoverPendingAnnotationRows && 'hovered-pending-annotations',
      annotationIsNotFound(annotationSet, label) && 'missing',
      isAnnotationInEditMode(annotationId()) && 'editing',
    ]"
    @click="onAnnotationClick"
    @mouseover="hoveredAnnotation = annotationId()"
    @mouseleave="hoveredAnnotation = null"
  >
    <div
      class="annotation-row-left"
      @mouseenter="onAnnotationHoverEnter(defaultSpan)"
      @mouseleave="onAnnotationHoverLeave"
    >
      <div class="annotation-icon">
        <AnnotationDetails
          :description="label.description"
          :annotation="annotation"
          :annotation-set="annotationSet"
          :label="label"
          :from-table="fromTable"
        />
      </div>

      <div
        v-if="showLabel"
        :class="[
          'label-name',
          annotationIsNotFound(annotationSet, label) && 'not-found-text',
        ]"
      >
        <span>{{ label.name }} </span>
      </div>
    </div>
    <div class="annotation-row-right">
      <div class="annotation-content">
        <div v-if="annotation">
          <div
            v-for="(span, index) in spanForEditing
              ? spanSelection
              : annotation.span"
            :key="index"
            @mouseenter="onAnnotationHoverEnter(span)"
            @mouseleave="onAnnotationHoverLeave"
          >
            <AnnotationContent
              :annotation="annotation"
              :span="span"
              :span-index="index"
              :label="label"
              :annotation-set="annotationSet"
              :is-hovered="hoveredAnnotation"
              :save-changes="saveChanges"
              @save-annotation-changes="handleSaveAnnotationChanges"
            />
          </div>
        </div>
        <div v-else>
          <div v-if="spanSelection && isAnnotationInEditMode(annotationId())">
            <EmptyAnnotation
              v-for="(span, index) in spanSelection"
              :key="index"
              :span="span"
              :span-index="index"
              :label="label"
              :annotation-set="annotationSet"
              :is-hovered="hoveredAnnotation"
              :save-changes="saveChanges"
              @save-empty-annotation-changes="saveEmptyAnnotationChanges"
            />
          </div>
          <EmptyAnnotation
            v-else
            :label="label"
            :annotation-set="annotationSet"
            :is-hovered="hoveredAnnotation"
            :save-changes="saveChanges"
            @save-empty-annotation-changes="saveEmptyAnnotationChanges"
          />
        </div>
      </div>
      <div v-if="showButtons" class="buttons-container">
        <AnnotationActionButtons
          :cancel-btn="showCancelButton()"
          :accept-btn="showAcceptButton()"
          :decline-btn="showDeclineButton()"
          :show-missing-btn="showMissingButton()"
          :save-btn="showSaveButton()"
          :restore-btn="showRestoreButton()"
          :is-loading="isLoading"
          @mark-as-missing="handleMissingAnnotation()"
          @save="handleSaveChanges()"
          @accept="handleSaveChanges()"
          @decline="handleSaveChanges(true)"
          @cancel="handleCancelButton()"
          @restore="handleRestore()"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import AnnotationDetails from "./AnnotationDetails";
import AnnotationContent from "./AnnotationContent";
import EmptyAnnotation from "./EmptyAnnotation";
import AnnotationActionButtons from "./AnnotationActionButtons";

export default {
  name: "AnnotationRow",
  components: {
    AnnotationDetails,
    AnnotationContent,
    EmptyAnnotation,
    AnnotationActionButtons,
  },
  props: {
    annotationSet: {
      type: Object,
      required: true,
    },
    label: {
      type: Object,
      required: true,
    },
    annotation: {
      type: Object,
      default: null,
    },
    showLabel: {
      type: Boolean,
      default: true,
    },
    showButtons: {
      type: Boolean,
      default: true,
    },
    isSmall: {
      type: Boolean,
      default: false,
    },
    showHover: {
      type: Boolean,
      default: true,
    },
    fromTable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isLoading: false,
      isSelected: false,
      annotationAnimationTimeout: null,
      hoveredAnnotation: null,
      saveChanges: false,
      toDecline: false,
    };
  },
  computed: {
    ...mapState("document", [
      "editAnnotation",
      "sidebarAnnotationSelected",
      "hoveredAnnotationSet",
      "enableGroupingFeature",
      "publicView",
      "selectedEntities",
      "newAcceptedAnnotations",
      "annotationsMarkedAsMissing",
      "documentId",
      "showActionError",
      "missingAnnotations",
      "documentIsReviewed",
    ]),
    ...mapState("selection", ["spanSelection", "elementSelected"]),
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "annotationIsNotFound",
    ]),
    ...mapGetters("selection", ["isValueArray"]),
    defaultSpan() {
      if (
        this.annotation &&
        this.annotation.span &&
        this.annotation.span.length > 0
      ) {
        return this.annotation.span[0];
      }
      return null;
    },
    spanForEditing() {
      return (
        this.spanSelection &&
        this.isValueArray(this.spanSelection) &&
        this.isAnnotationInEditMode(this.annotationId())
      );
    },
    spanFromSelectedEntities() {
      return this.selectedEntities.flatMap((ann) => {
        return { ...ann.entity.original, offset_string: ann.content };
      });
    },
    isAnnotation() {
      return (
        this.annotation &&
        this.isAnnotationInEditMode(
          this.annotationId(),
          this.editAnnotation.index
        )
      );
    },
    hoverEmptyLabelRows() {
      return (
        this.hoveredAnnotationSet &&
        this.hoveredAnnotationSet.type == "missing" &&
        !this.annotationIsNotFound(this.annotationSet, this.label) &&
        this.annotationSet.id === this.hoveredAnnotationSet.annotationSet.id &&
        this.annotationSet.label_set.id ===
          this.hoveredAnnotationSet.annotationSet.label_set.id &&
        this.hoveredEmptyLabels() === this.label.id
      );
    },
    hoverPendingAnnotationRows() {
      return (
        this.hoveredAnnotationSet &&
        this.hoveredAnnotationSet.type == "accept" &&
        this.annotation &&
        this.hoveredPendingAnnotations() === this.annotation.id
      );
    },
  },
  watch: {
    sidebarAnnotationSelected(newSidebarAnnotationSelected) {
      if (
        newSidebarAnnotationSelected &&
        this.annotation &&
        this.annotation.id === newSidebarAnnotationSelected.id
      ) {
        clearTimeout(this.annotationAnimationTimeout);

        const runAnimation = () => {
          this.$el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
          this.isSelected = true;
          // remove annotation selection after some time
          this.annotationAnimationTimeout = setTimeout(() => {
            this.$store.dispatch("document/setSidebarAnnotationSelected", null);
            this.isSelected = false;
          }, 1500);
        };
        runAnimation();
      }
    },
    editAnnotation(newValue) {
      if (!newValue) {
        this.saveChanges = false;
        this.isLoading = false;
      }
    },
    newAcceptedAnnotations(newValue) {
      if (newValue) {
        this.enableLoading(newValue);
      } else {
        this.isLoading = false;
      }
    },
    annotationsMarkedAsMissing(newValue) {
      if (newValue) {
        this.enableLoading();
      } else {
        this.isLoading = false;
      }
    },
    showActionError(newValue) {
      if (newValue) {
        this.isLoading = false;
      }
    },
  },
  methods: {
    annotationId() {
      if (!this.annotationSet || !this.label) return;

      if (this.annotation && this.annotation.id) return this.annotation.id;

      let emptyAnnotationId;

      if (this.annotationSet.id) {
        emptyAnnotationId = `${this.annotationSet.id}_${this.label.id}`;
      } else {
        emptyAnnotationId = `${this.annotationSet.label_set.id}_${this.label.id}`;
      }
      return emptyAnnotationId;
    },
    onAnnotationHoverEnter(span) {
      if (span) {
        this.$store.dispatch("document/setDocumentAnnotationSelected", {
          annotation: this.annotation,
          label: this.fromTable ? null : this.label,
          span,
          scrollTo: false,
        });
      }
    },
    onAnnotationHoverLeave() {
      this.$store.dispatch("document/disableDocumentAnnotationSelected");
    },
    onAnnotationClick() {
      if (!this.fromTable) {
        this.$store.dispatch("display/showAnnSetTable", null);
      }
      this.$store.dispatch("document/scrollToDocumentAnnotationSelected");
    },
    hoveredEmptyLabels() {
      // This method will change the style of the Empty Annotations in the same Label Set
      // when the "mark all as missing" button is hovered
      if (!this.hoveredAnnotationSet) return;

      const labels = this.hoveredAnnotationSet.annotationSet.labels.map(
        (label) => {
          return JSON.parse(JSON.stringify(label));
        }
      );
      const found = labels.find((l) => l.id === this.label.id);
      if (found && found.annotations.length === 0) return found.id;
      return null;
    },
    hoveredPendingAnnotations() {
      // This method will change the style of Annotations in the same Label Set
      // when the "Accept all" button is hovered
      if (!this.hoveredAnnotationSet) return;

      const annotations =
        this.hoveredAnnotationSet.annotationSet.labels.flatMap((label) => {
          return label.annotations;
        });

      // Check if there are no annotations OR if there are annotations for the same label (grouped)
      if (
        annotations.length === 0 ||
        (this.label.annotations.length > 1 && this.enableGroupingFeature)
      )
        return;

      const found = annotations.find(
        (ann) => ann.id === this.annotation.id && !ann.revised
      );

      if (found) {
        return found.id;
      } else {
        return null;
      }
    },
    showAcceptButton() {
      return (
        !this.isAnnotationInEditMode(this.annotationId()) &&
        this.annotation &&
        !this.annotation.revised &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showDeclineButton() {
      return (
        !this.isAnnotationInEditMode(this.annotationId()) &&
        this.annotation &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showMissingButton() {
      return (
        this.hoveredAnnotation &&
        !this.isAnnotationInEditMode(this.annotationId()) &&
        !this.annotation &&
        !this.annotationIsNotFound(this.annotationSet, this.label)
      );
    },
    showRestoreButton() {
      return (
        this.hoveredAnnotation &&
        !this.isAnnotationInEditMode(this.annotationId()) &&
        this.annotationIsNotFound(this.annotationSet, this.label)
      );
    },
    showCancelButton() {
      if (!this.editAnnotation || this.isLoading) return;

      if (this.isAnnotationInEditMode(this.annotationId())) {
        return true;
      }
    },
    showSaveButton() {
      if (!this.editAnnotation || this.isLoading) return;

      // Check if it's an Annotation or Empty Annotation
      if (this.isAnnotation) {
        return true;
      } else {
        if (!this.isAnnotationInEditMode(this.annotationId())) return;

        // Check if an entity was selected instead of bbox
        if (this.selectedEntities && this.selectedEntities.length > 0) {
          return this.elementSelected === this.annotationId();
        } else {
          // Check if an entity was selected instead of bbox
          return (
            this.elementSelected === this.annotationId() &&
            this.spanSelection &&
            Array.isArray(this.spanSelection)
          );
        }
      }
    },
    handleMissingAnnotation() {
      if (!this.label || !this.annotationSet) return;

      // will emit to the DocumentAnnotations component, where the method is handled
      // & dispatched to the store
      this.$parent.$emit(
        "handle-missing-annotation",
        this.label.id,
        this.annotationSet.label_set.id,
        this.annotationSet.id,
        false
      );
    },
    handleSaveChanges(decline) {
      if (this.publicView || this.documentIsReviewed) return;

      if (
        this.showAcceptButton() ||
        this.showDeclineButton() ||
        this.isAnnotationInEditMode(
          this.annotationId(),
          this.editAnnotation.index
        )
      ) {
        this.saveChanges = true;
        if (decline) {
          this.toDecline = true;
        }
      }

      if (
        !this.annotation &&
        this.isAnnotationInEditMode(this.annotationId())
      ) {
        this.saveEmptyAnnotationChanges();
      }
    },
    handleRestore() {
      this.isLoading = true;

      const foundItem = this.missingAnnotations.find(
        (item) =>
          item.annotation_set === this.annotationSet.id &&
          item.label === this.label.id &&
          item.label_set === this.annotationSet.label_set.id
      );

      this.$store
        .dispatch("document/deleteMissingAnnotation", foundItem.id)
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        })
        .finally(() => {
          this.isLoading = false;
          this.closedTag = null;
        });
    },
    handleSaveAnnotationChanges(
      annotation,
      spanIndex,
      annotationSpan,
      annotationText
    ) {
      let updatedString;

      this.isLoading = true;

      // Check if we are deleting a single annotation that it's not multi-lined
      let isToDelete =
        annotationText.length === 0 &&
        (!this.isValueArray(annotation.span) || annotation.span.length === 1);

      let storeAction;

      if (isToDelete || this.toDecline) {
        storeAction = "document/deleteAnnotation";
      } else {
        storeAction = "document/updateAnnotation";

        let spans = [...annotation.span];

        // Validations to consider span as an array (multiline annotations) or object
        if (annotationText.length === 0 && this.isValueArray(annotation.span)) {
          // if the annotation content in one row was deleted
          // check if it it part of an array
          // to only remove that string
          spans.splice(spanIndex, 1);
        } else if (
          this.spanSelection &&
          this.isValueArray(this.spanSelection)
        ) {
          let span;

          // Check if editing was from selecting an entity
          if (this.selectedEntities && this.selectedEntities.length > 0) {
            span = this.spanFromSelectedEntities;
          } else {
            spans = [...this.spanSelection];
            span = this.createSpan(
              this.spanSelection[spanIndex],
              annotationText
            );
          }

          // span is array, only update current one
          spans[spanIndex] = {
            ...spans[spanIndex],
            span,
          };
        } else {
          // if span is NOT an array, but an object
          let span;

          if (this.selectedEntities && this.selectedEntities.length > 0) {
            spans = this.spanFromSelectedEntities;
          } else if (this.spanSelection) {
            span = this.createSpan(this.spanSelection, annotationText);

            spans[spanIndex] = {
              ...spans[spanIndex],
              ...span,
            };
          } else {
            span = this.createSpan(annotationSpan, annotationText);

            spans[spanIndex] = {
              ...spans[spanIndex],
              ...span,
            };
          }
        }

        updatedString = {
          is_correct: true,
          revised: true,
          span: spans,
        };
      }

      // Send to the store for the http patch/delete request
      this.$store
        .dispatch(storeAction, {
          updatedValues: updatedString,
          annotationId: this.annotation.id,
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        })
        .finally(() => {
          this.$store.dispatch("document/resetEditAnnotation");
          this.$store.dispatch("selection/disableSelection");
          this.$store.dispatch("document/setSelectedEntities", null);
          this.toDecline = false;
        });
    },
    createSpan(span, annotationText) {
      return {
        offset_string: annotationText,
        page_index: span.page_index,
        x0: span.x0,
        x1: span.x1,
        y0: span.y0,
        y1: span.y1,
        start_offset: span.start_offset,
        end_offset: span.end_offset,
      };
    },
    saveEmptyAnnotationChanges() {
      let annotationToCreate;
      let span;

      if (this.selectedEntities && this.selectedEntities.length > 0) {
        span = this.spanFromSelectedEntities;
      } else {
        span = this.spanSelection;
      }

      if (this.annotationSet.id) {
        annotationToCreate = {
          document: this.documentId,
          span: span,
          label: this.label.id,
          annotation_set: this.annotationSet.id,
          is_correct: true,
          revised: true,
        };
      } else {
        // if annotation set id is null
        annotationToCreate = {
          document: this.documentId,
          span: span,
          label: this.label.id,
          label_set: this.annotationSet.label_set.id,
          is_correct: true,
          revised: true,
        };
      }
      this.isLoading = true;

      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        })
        .finally(() => {
          this.$store.dispatch("document/resetEditAnnotation");
          this.handleCancelButton();
        });
    },
    handleCancelButton() {
      this.$store.dispatch("document/resetEditAnnotation");
      if (this.elementSelected) {
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("document/setSelectedEntities", null);
      }
    },
    enableLoading(annotations) {
      if (annotations && this.annotation) {
        const found = annotations.find(
          (annotation) => annotation === this.annotation.id
        );

        if (found) {
          this.isLoading = true;
          this.saveChanges = false;
          return;
        }

        this.isLoading = false;
        this.saveChanges = false;
        return;
      }

      // Check for what empty annotations we want to show the loading
      // while waiting for it to be removed from the row
      if (!this.annotationsMarkedAsMissing) {
        this.isLoading = false;
        this.saveChanges = false;
        return;
      }

      if (this.annotationsMarkedAsMissing.length > 0) {
        this.annotationsMarkedAsMissing.map((annotation) => {
          // Check if the annotation set and label are marked as missing
          if (
            annotation.label_set === this.annotationSet.label_set.id &&
            annotation.annotation_set === this.annotationSet.id &&
            annotation.label === this.label.id
          ) {
            // Check if we wanna add loading to all empty annotations
            if (this.hoveredAnnotationSet) {
              this.isLoading = true;
              this.saveChanges = false;
              return;
            }

            // or we want to add loading to a single one
            if (
              !this.hoveredAnnotationSet &&
              annotation.label === this.label.id
            ) {
              this.isLoading = true;
              this.saveChanges = false;
              return;
            }
          }
        });
      }
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
