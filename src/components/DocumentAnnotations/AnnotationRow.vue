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
          :cancel-btn="isAnnotationInEditMode(annotationId())"
          :accept-btn="showAcceptButton()"
          :show-reject="showRejectButton()"
          :save-btn="showSaveButton()"
          :is-loading="isLoading"
          @reject="handleReject()"
          @save="handleSaveChanges()"
          @accept="handleSaveChanges()"
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
    };
  },
  computed: {
    ...mapState("document", [
      "editAnnotation",
      "sidebarAnnotationSelected",
      "hoveredAnnotationSet",
      "enableGroupingFeature",
      "publicView",
      "selectedEntity",
      "newAcceptedAnnotations",
      "rejectedMissingAnnotations",
    ]),
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
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
    showAcceptButton() {
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
    showSaveButton() {
      if (!this.editAnnotation) return;

      // Check if it's an Annotation or Empty Annotation
      if (
        this.annotation &&
        this.isAnnotationInEditMode(this.annotationId()) &&
        this.spanSelection
      ) {
        return true;
      } else if (
        this.selectedEntity &&
        this.selectionEnabled === this.annotationId() &&
        !this.isLoading
      ) {
        return true;
      }
      return false;
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
    handleSaveChanges() {
      if (
        this.isAnnotationInEditMode(this.annotationId()) ||
        this.showAcceptButton()
      ) {
        this.saveChanges = true;
      }
    },
    handleCancelButton() {
      this.$store.dispatch("document/resetEditAnnotation");
      if (this.selectionEnabled) {
        this.$store.dispatch("selection/disableSelection");
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
