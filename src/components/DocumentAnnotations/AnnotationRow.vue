<template>
  <div
    :class="[
      'annotation-row',
      isSelected && 'selected',
      isAnnotationInEditMode(annotationId()) && 'editing',
      hoveredAnnotationSet &&
        hoveredAnnotationSet.type == 'reject' &&
        annotationSet.id === hoveredAnnotationSet.annotationSet.id &&
        annotationSet.label_set.id ===
          hoveredAnnotationSet.annotationSet.label_set.id &&
        hoveredEmptyLabels() === label.id &&
        'hovered-empty-labels',
      hoveredAnnotationSet &&
        hoveredAnnotationSet.type == 'accept' &&
        annotation &&
        hoveredPendingAnnotations() === annotation.id &&
        'hovered-pending-annotations',
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
      <AnnotationDetails
        :description="label.description"
        :annotation="annotation"
      />
      <div class="label-name">
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
            />
          </div>
          <EmptyAnnotation
            v-else
            :label="label"
            :annotation-set="annotationSet"
            :is-hovered="hoveredAnnotation"
            :save-changes="saveChanges"
          />
        </div>
      </div>
      <div class="buttons-container">
        <ActionButtons
          :cancel-btn="showCancelButton()"
          :accept-btn="showAcceptAndDeclineButtons()"
          :decline-btn="showAcceptAndDeclineButtons()"
          :show-reject="showRejectButton()"
          :save-btn="showSaveButton()"
          :is-loading="isLoading"
          @reject="handleReject()"
          @save="handleSaveChanges()"
          @accept="handleSaveChanges()"
          @decline="handleSaveChanges(true)"
          @cancel="handleCancelButton()"
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
import ActionButtons from "./ActionButtons";

export default {
  name: "AnnotationRow",
  components: {
    AnnotationDetails,
    AnnotationContent,
    EmptyAnnotation,
    ActionButtons,
  },
  props: {
    annotationSet: {
      required: true,
    },
    label: {
      required: true,
    },
    annotation: {
      default: null,
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
      "rejectedMissingAnnotations",
      "documentId",
      "showActionError",
    ]),
    ...mapState("selection", ["spanSelection", "elementSelected"]),
    ...mapGetters("document", ["isAnnotationInEditMode"]),
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
    rejectedMissingAnnotations(newValue) {
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
          label: this.label,
          span,
          scrollTo: false,
        });
      }
    },
    onAnnotationHoverLeave() {
      this.$store.dispatch("document/disableDocumentAnnotationSelected");
    },
    onAnnotationClick() {
      this.$store.dispatch("document/scrollToDocumentAnnotationSelected");
    },
    hoveredEmptyLabels() {
      // This method will change the style of the Empty Annotations in the same Label Set
      // when the "Reject all" button is hovered
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
    showAcceptAndDeclineButtons() {
      return (
        !this.isAnnotationInEditMode(this.annotationId()) &&
        this.annotation &&
        !this.annotation.revised &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showRejectButton() {
      return (
        this.hoveredAnnotation &&
        !this.isAnnotationInEditMode(this.annotationId()) &&
        !this.annotation
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
          if (!this.isAnnotationInEditMode(this.annotationId())) return;
          // Check if an entity was selected instead of bbox
          if (this.selectedEntities && this.selectedEntities.length > 0) {
            return this.elementSelected === this.annotationId();
          } else {
            return (
              this.elementSelected === this.annotationId() &&
              this.spanSelection &&
              Array.isArray(this.spanSelection)
            );
          }
        }
      }
    },
    handleReject() {
      if (!this.label || !this.annotationSet) return;

      // will emit to the DocumentAnnotations component, where the method is handled
      // & dispatched to the store
      this.$parent.$emit(
        "handle-reject",
        this.label.id,
        this.annotationSet.label_set.id,
        this.annotationSet.id,
        false
      );
    },
    handleSaveChanges(decline) {
      if (this.publicView) return;

      if (
        this.showAcceptAndDeclineButtons() ||
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
            spans[spanIndex] = this.spanFromSelectedEntities;
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
        .then((response) => {
          if (!response) return;

          this.$store.dispatch("document/createErrorMessage", {
            response,
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
        .then((response) => {
          if (!response) return;
          // TODO: this should be handled with the catch
          this.$store.dispatch("document/createErrorMessage", {
            response,
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
      if (!this.rejectedMissingAnnotations) {
        this.isLoading = false;
        this.saveChanges = false;
        return;
      }

      if (this.rejectedMissingAnnotations.length > 0) {
        this.rejectedMissingAnnotations.map((annotation) => {
          // Check if the annotation set and label are rejected
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
