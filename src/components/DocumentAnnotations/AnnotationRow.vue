<template>
  <div
    :class="[
      'annotation-row',
      isSelected && 'selected',
      hoverEmptyLabelRows && 'hovered-empty-labels',
      hoverPendingAnnotationRows && 'hovered-pending-annotations',
      annotationIsNotFound(annotationSet, label) && 'missing',
      isAnnotationInEditMode(annotationId()) && 'editing',
      publicView && 'clickable-cursor',
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

      <div
        v-if="showAnnotationTranslations"
        :class="['annotation-translation', !isDocumentReviewed && 'pointer']"
        @click="editAnnotationTranslation(annotation.id)"
      >
        <b-tooltip :animated="false" position="is-bottom">
          <div class="icon">
            <TranslateArrows :translation="annotation.translated_string" />
          </div>

          <template #content>
            <div class="translation-details">
              <div class="translation-title">
                <span>{{ $t("translated_string_title") }}</span>
                <span
                  :class="[
                    'translated-string',
                    !annotation.translated_string && 'no-translation',
                  ]"
                >
                  {{
                    annotation.translated_string
                      ? annotation.translated_string
                      : $t("no_translated_string")
                  }}
                </span>
              </div>
            </div>
            <div class="translation-info">
              <div v-if="!isDocumentReviewed" class="annotation-details-link">
                {{
                  annotation.translated_string
                    ? $t("edit_translation")
                    : $t("add_translation")
                }}
              </div>
            </div>
          </template>
        </b-tooltip>
      </div>
    </div>
    <div class="annotation-row-right">
      <div class="annotation-content">
        <div v-if="annotation && !isNegative(annotation)">
          <div
            v-for="(span, index) in spanForEditing
              ? spanSelection
              : annotation.span"
            :key="index"
            @mouseenter="onAnnotationHoverEnter(span)"
            @mouseleave="onAnnotationHoverLeave"
          >
            <AnnotationContent
              :ref="`span_${annotation.id}_${index}`"
              :annotation="annotation"
              :span="span"
              :span-index="index"
              :label="label"
              :annotation-set="annotationSet"
              :is-hovered="hoveredAnnotation"
              @save-annotation-changes="handleSaveChanges"
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
              :is-missing-annotation="
                annotationIsNotFound(annotationSet, label)
              "
              @save-empty-annotation-changes="saveEmptyAnnotationChanges"
            />
          </div>
          <EmptyAnnotation
            v-else-if="!fromTable"
            :label="label"
            :annotation-set="annotationSet"
            :is-hovered="hoveredAnnotation"
            :is-missing-annotation="annotationIsNotFound(annotationSet, label)"
            @save-empty-annotation-changes="saveEmptyAnnotationChanges"
          />
        </div>
      </div>
      <div class="buttons-container">
        <AnnotationActionButtons
          :cancel-btn="showCancelButton()"
          :accept-btn="showAcceptButton()"
          :decline-btn="showDeclineButton()"
          :show-missing-btn="showMissingButton()"
          :save-btn="showSaveButton()"
          :restore-btn="showRestoreButton()"
          :is-loading="isLoading"
          @mark-as-missing="handleMissingAnnotation"
          @save="handleSaveChanges"
          @accept="handleSaveChanges"
          @decline="handleSaveChanges(true)"
          @cancel="handleCancelButton"
          @restore="handleRestore"
          @search-label-in-document="searchLabelInDocument"
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
import TranslateArrows from "../../assets/images/TranslateArrows";

import { isElementArray } from "../../utils/utils";
import api from "../../api";

export default {
  name: "AnnotationRow",
  components: {
    AnnotationDetails,
    AnnotationContent,
    EmptyAnnotation,
    AnnotationActionButtons,
    TranslateArrows,
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
    };
  },
  computed: {
    ...mapState("document", [
      "editAnnotation",
      "sidebarAnnotationSelected",
      "hoveredAnnotationSet",
      "enableGroupingFeature",
      "publicView",
      "newAcceptedAnnotations",
      "annotationsMarkedAsMissing",
      "documentId",
      "showActionError",
      "missingAnnotations",
    ]),
    ...mapState("selection", [
      "spanSelection",
      "elementSelected",
      "selectedEntities",
    ]),
    ...mapState("project", ["showAnnotationTranslations"]),
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "annotationIsNotFound",
      "isDocumentReviewed",
      "isNegative",
    ]),
    defaultSpan() {
      if (
        this.annotation &&
        !this.isNegative(this.annotation) &&
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
        isElementArray(this.spanSelection) &&
        this.isAnnotationInEditMode(this.annotationId())
      );
    },
    isAnnotation() {
      return (
        this.annotation &&
        !this.isNegative(this.annotation) &&
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
        !this.isNegative(this.annotation) &&
        this.hoveredNotCorrectAnnotations() === this.annotation.id
      );
    },
  },
  watch: {
    sidebarAnnotationSelected(newSidebarAnnotationSelected) {
      if (!newSidebarAnnotationSelected) return;

      let annotationSelected;

      if (newSidebarAnnotationSelected.annotation) {
        annotationSelected = newSidebarAnnotationSelected.annotation;
      } else {
        annotationSelected = newSidebarAnnotationSelected;
      }

      if (
        this.annotation &&
        !this.isNegative(this.annotation) &&
        this.annotation.id === annotationSelected.id
      ) {
        clearTimeout(this.annotationAnimationTimeout);

        this.isSelected = true;
        // remove annotation selection after some time
        this.annotationAnimationTimeout = setTimeout(() => {
          this.$store.dispatch("document/setSidebarAnnotationSelected", null);
          this.isSelected = false;
        }, 1200);

        // Check if sidebarAnnotationSelected changed from a click or hover
        const runAnimation = () => {
          this.$el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        };
        runAnimation();
      }
    },
    editAnnotation(newValue) {
      if (!newValue) {
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
    selectedEntities(newValue) {
      if (!newValue) return;

      if (this.isAnnotationInEditMode(this.annotationId())) {
        this.isLoading = true;
      }
    },
    spanSelection(newValue) {
      // check if spanSelection has new value from entity selection
      // to stop loading after the text appears in the field
      if (newValue) {
        this.isLoading = false;
      }
    },
  },
  methods: {
    annotationId() {
      if (!this.annotationSet || !this.label) return;

      if (
        this.annotation &&
        this.annotation.id &&
        !this.isNegative(this.annotation)
      )
        return this.annotation.id;

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
      const negativeAnnotations = found.annotations.find((annotation) =>
        this.isNegative(annotation)
      );

      if ((found && found.annotations.length === 0) || negativeAnnotations)
        return found.id;
      return null;
    },
    hoveredNotCorrectAnnotations() {
      // This method will change the style of Annotations in the same Label Set
      // when the "Accept all" button is hovered
      if (!this.hoveredAnnotationSet) return;

      const annotations =
        this.hoveredAnnotationSet.annotationSet.labels.flatMap((label) => {
          return label.annotations;
        });

      // Check if there are no annotations
      if (annotations.length === 0) return;

      const found = annotations.find(
        (ann) => ann.id === this.annotation.id && !ann.is_correct
      );

      if (found) {
        return found.id;
      } else {
        return null;
      }
    },
    showAcceptButton() {
      return (
        !this.editAnnotation &&
        !this.isAnnotationInEditMode(this.annotationId()) &&
        this.annotation &&
        !this.isNegative(this.annotation) &&
        !this.annotation.is_correct &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showDeclineButton() {
      return (
        !this.editAnnotation &&
        !this.isAnnotationInEditMode(this.annotationId()) &&
        this.annotation &&
        !this.isNegative(this.annotation) &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showMissingButton() {
      return (
        !this.editAnnotation &&
        this.hoveredAnnotation &&
        !this.isAnnotationInEditMode(this.annotationId()) &&
        (!this.annotation || this.isNegative(this.annotation)) &&
        !this.annotationIsNotFound(this.annotationSet, this.label)
      );
    },
    showRestoreButton() {
      return (
        !this.editAnnotation &&
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

        return (
          this.elementSelected === this.annotationId() &&
          this.spanSelection &&
          Array.isArray(this.spanSelection)
        );
      }
    },
    handleMissingAnnotation() {
      if (!this.label || !this.annotationSet) return;

      this.isLoading = true;

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
    handleSaveChanges(decline = false) {
      if (this.publicView || this.isDocumentReviewed) return;

      // Verify if we are editing a filled or empty annotation
      if (
        this.annotation &&
        !this.isNegative(this.annotation) &&
        (this.showAcceptButton() ||
          this.showDeclineButton() ||
          this.isAnnotationInEditMode(
            this.annotationId(),
            this.editAnnotation.index
          ))
      ) {
        let spans = [];
        let showAiWarning = false;

        if (!decline) {
          Object.keys(this.$refs).forEach((ref) => {
            if (ref.includes(`span_${this.annotation.id}`)) {
              const refElement = this.$refs[ref][0];
              // call child component createSpan method
              if (!refElement) return;

              const span = refElement.createSpan();

              // only add span if it's not null (offset_string not empty)
              if (span) {
                showAiWarning = span.is_custom;
                spans.push(span);
              }
            }
          });
        }

        if (showAiWarning) {
          this.$buefy.dialog.confirm({
            container: "#app .dv-ui-app-container",
            canCancel: "button",
            message: this.$t("edit_ann_content_warning"),
            onConfirm: () => this.saveAnnotationChanges(spans, decline),
            onCancel: () => this.handleCancelButton(),
          });
        } else {
          this.saveAnnotationChanges(spans, decline);
        }
      } else if (
        (!this.annotation || this.isNegative(this.annotation)) &&
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
    saveAnnotationChanges(spans, isToDecline) {
      // This function deals with declining Annotations
      // or editing an Annotation or a part of it (if multi line)
      this.isLoading = true;

      let updatedString; // what will be sent to the API
      let storeAction; // if it will be 'delete' or 'patch'

      // Verify if we delete the entire Annotation or a part of the text
      if (isToDecline || spans.length === 0) {
        storeAction = "document/deleteAnnotation";
      } else {
        // Editing the Annotation
        // Deleting part of multi-line Annotation
        storeAction = "document/updateAnnotation";

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
          annotationSet: this.annotationSet,
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
          this.$store.dispatch("selection/setSelectedEntities", null);
        });
    },
    saveEmptyAnnotationChanges() {
      let annotationToCreate;

      if (this.annotationSet.id) {
        annotationToCreate = {
          document: this.documentId,
          span: this.spanSelection,
          label: this.label.id,
          annotation_set: this.annotationSet.id,
          is_correct: true,
          revised: true,
        };
      } else {
        // if annotation set id is null
        annotationToCreate = {
          document: this.documentId,
          span: this.spanSelection,
          label: this.label.id,
          label_set: this.annotationSet.label_set.id,
          is_correct: true,
          revised: true,
        };
      }
      this.isLoading = true;
      let negativeAnnotationId;

      // check if the annotation to create comes from a negative annotation
      // so we can create the new one and remove the negative one from the annotations array
      if (this.isNegative(this.annotation)) {
        negativeAnnotationId = this.annotation.id;
      }

      this.$store
        .dispatch("document/createAnnotation", {
          annotation: annotationToCreate,
          negativeAnnotationId: negativeAnnotationId,
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
          this.handleCancelButton();
        });
    },
    handleCancelButton() {
      this.$store.dispatch("document/resetEditAnnotation");
      if (this.elementSelected) {
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("selection/setSelectedEntities", null);
      }
    },
    enableLoading(annotations) {
      if (annotations && this.annotation && !this.annotation.is_correct) {
        const found = annotations.find(
          (annotation) => annotation === this.annotation.id
        );

        if (found) {
          this.isLoading = true;
          return;
        }

        this.isLoading = false;
        return;
      }

      // Check for what empty annotations we want to show the loading
      // while waiting for it to be removed from the row
      if (!this.annotationsMarkedAsMissing) {
        this.isLoading = false;
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
              return;
            }

            // or we want to add loading to a single one
            if (
              !this.hoveredAnnotationSet &&
              annotation.label === this.label.id
            ) {
              this.isLoading = true;
              return;
            }
          }
        });
      }
    },
    editAnnotationTranslation(annotationId) {
      if (!annotationId || this.isDocumentReviewed) return;

      const baseUrl = api.FILE_URL ? api.FILE_URL : api.DEFAULT_URL;

      const annotationDetailsUrl = `${baseUrl}/admin/server/sequenceannotation/${annotationId}/change/`;

      window.open(annotationDetailsUrl, "_blank");
    },
    searchLabelInDocument() {
      this.$store.dispatch("display/enableSearch", true);
      this.$store.dispatch("display/setCurrentSearch", this.label.name);
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
