<template>
  <div
    :class="[
      'annotation-row',
      isSelected && 'selected',
      hoverEmptyLabelRows && 'hovered-empty-labels',
      hoverPendingAnnotationRows && 'hovered-pending-annotations',
      annotationIsNotFound(annotationSet, label) && 'missing',
      isAnnotationInEditMode(currentAnnotationId()) && 'editing',
      publicView && 'clickable-cursor',
    ]"
    @click="onAnnotationClick"
    @mouseover="hoveredAnnotation = currentAnnotationId()"
    @mouseleave="hoveredAnnotation = null"
  >
    <div
      class="annotation-row-left"
      :style="`width:${labelWidth}%`"
      @mouseenter="onAnnotationHoverEnter(defaultSpan)"
      @mouseleave="onAnnotationHoverLeave"
    >
      <div class="annotation-icon">
        <AnnotationDetails
          :description="label.description"
          :annotation="annotation"
          :annotation-set="annotationSet"
          :label="label"
        />
      </div>

      <div
        v-if="showLabel"
        :class="[
          'label-name',
          annotationIsNotFound(annotationSet, label) && 'not-found-text',
        ]"
      >
        <span @click="selectAnnotation">{{ label.name }} </span>
      </div>

      <div
        v-if="
          showAnnotationTranslations &&
          annotation &&
          annotation.translated_string
        "
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

    <div class="annotation-row-right" :style="`width:${annotationWidth}%`">
      <div class="annotation-content">
        <div v-if="annotation" class="annotation-items">
          <b-checkbox
            v-if="annotation.metadata && annotation.metadata.checkbox"
            v-model="isChecked"
            class="annotation-checkbox"
          />
          <div class="annotation-spans">
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
        </div>
        <div v-else>
          <div
            v-if="
              spanSelection && isAnnotationInEditMode(currentAnnotationId())
            "
          >
            <EmptyAnnotation
              v-for="(span, index) in spanSelection"
              :key="index"
              :span="span"
              :span-index="index"
              :label="label"
              :annotation-set="annotationSet"
              :label-set="labelSet"
              :is-hovered="hoveredAnnotation"
              :is-missing-annotation="
                annotationIsNotFound(annotationSet, label)
              "
              @save-empty-annotation-changes="saveEmptyAnnotationChanges"
            />
          </div>
          <EmptyAnnotation
            v-else
            :label="label"
            :annotation-set="annotationSet"
            :label-set="labelSet"
            :is-hovered="hoveredAnnotation"
            :is-missing-annotation="annotationIsNotFound(annotationSet, label)"
            @save-empty-annotation-changes="saveEmptyAnnotationChanges"
          />
        </div>
      </div>
      <div
        v-if="showAnnotationActions()"
        :class="`buttons-container ${
          isAnnotationInEditMode(currentAnnotationId()) ? 'is-ann-editing' : ''
        }`"
      >
        <AnnotationActionButtons
          :annotation="annotation"
          :show-cancel="showCancelButton()"
          :show-accept="showAcceptButton()"
          :show-decline="showDeclineButton()"
          :show-missing="showMissingButton()"
          :show-search="showMissingButton()"
          :show-save="showSaveButton()"
          :show-restore="showRestoreButton()"
          :show-link="showLinkButton()"
          :is-loading="isLoading"
          @mark-as-missing="handleMissingAnnotation"
          @save="handleSaveChanges"
          @accept="handleSaveChanges"
          @decline="handleSaveChanges(true)"
          @cancel="handleCancelButton"
          @restore="handleRestore"
          @search="searchLabelInDocument"
          @link="copyAnnotationLink"
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
      default: null,
    },
    labelSet: {
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
  },
  data() {
    const checkboxValue =
      this.annotation &&
      this.annotation.metadata &&
      this.annotation.metadata.checkbox &&
      this.annotation.metadata.checkbox.is_checked;
    return {
      isLoading: false,
      isSelected: false,
      // annotationAnimationTimeout: null,
      hoveredAnnotation: null,
      checkboxDefaultValue: checkboxValue,
      isCheckboxAvailable: false,
      isChecked: checkboxValue,
    };
  },
  computed: {
    ...mapState("document", [
      "editAnnotation",
      "annotationId",
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
    ...mapState("display", ["labelWidth", "annotationWidth"]),
    ...mapState("project", ["showAnnotationTranslations"]),
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "annotationIsNotFound",
      "isDocumentReviewed",
    ]),
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
        isElementArray(this.spanSelection) &&
        this.isAnnotationInEditMode(this.currentAnnotationId())
      );
    },
    isAnnotation() {
      return (
        this.annotation &&
        this.isAnnotationInEditMode(
          this.currentAnnotationId(),
          this.editAnnotation.index
        )
      );
    },
    hoverEmptyLabelRows() {
      return (
        this.hoveredAnnotationSet &&
        this.hoveredAnnotationSet.type == "missing" &&
        this.annotationSet &&
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
        this.hoveredNotCorrectAnnotations() === this.annotation.id
      );
    },
  },
  watch: {
    annotationId(newAnnotationId) {
      this.checkAnnotationSelection(newAnnotationId);
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

      if (this.isAnnotationInEditMode(this.currentAnnotationId())) {
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
    isChecked() {
      if (this.isCheckboxAvailable) {
        this.handleCheckboxChanged(this.isChecked);
      } else {
        if (this.isChecked !== this.checkboxDefaultValue) {
          this.$buefy.dialog.confirm({
            container: "#app .dv-ui-app-container",
            canCancel: ["button"],
            message: this.$t("edit_ann_content_warning"),
            onConfirm: () => {
              this.isCheckboxAvailable = true;
              this.handleCheckboxChanged(this.isChecked);
            },
            onCancel: () => {
              this.isChecked = !this.isChecked;
            },
          });
        }
      }
    },
  },
  mounted() {
    this.checkAnnotationSelection(this.annotationId);
  },
  methods: {
    handleCheckboxChanged(value) {
      this.$store
        .dispatch("document/updateAnnotation", {
          updatedValues: {
            metadata: {
              checkbox: {
                is_checked: value,
              },
            },
          },
          annotationId: this.annotation.id,
          annotationSet: this.annotationSet,
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("edit_error"),
          });
        });
    },
    checkAnnotationSelection(newAnnotationId) {
      if (
        newAnnotationId &&
        this.annotation &&
        this.annotation.id == newAnnotationId
      ) {
        this.isSelected = true;
        // remove annotation selection after some time
        // this.annotationAnimationTimeout = setTimeout(() => {
        //   this.$store.dispatch("document/setSidebarAnnotationSelected", null);
        //   this.isSelected = false;
        // }, 1200);

        // Check if sidebarAnnotationSelected changed from a click or hover
        const runAnimation = () => {
          this.$el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        };
        runAnimation();
      } else {
        this.isSelected = false;
      }
    },
    currentAnnotationId() {
      if ((!this.annotationSet && !this.labelSet) || !this.label) return;

      if (this.annotation && this.annotation.id) return this.annotation.id;

      const setId = this.annotationSet
        ? this.annotationSet.id
        : this.labelSet.id;

      return `${setId}_${this.label.id}`;
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
    showAnnotationActions() {
      return (
        !this.publicView &&
        !this.isDocumentReviewed &&
        (this.isLoading ||
          this.showLinkButton() ||
          this.showAcceptButton() ||
          this.showDeclineButton() ||
          this.showMissingButton() ||
          this.showCancelButton() ||
          this.showSaveButton() ||
          this.showRestoreButton())
      );
    },
    showLinkButton() {
      return (
        !this.editAnnotation &&
        this.annotation &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showAcceptButton() {
      return (
        !this.editAnnotation &&
        !this.isAnnotationInEditMode(this.currentAnnotationId()) &&
        this.annotation &&
        !this.annotation.is_correct &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showDeclineButton() {
      return (
        !this.editAnnotation &&
        !this.isAnnotationInEditMode(this.currentAnnotationId()) &&
        this.annotation &&
        this.hoveredAnnotation === this.annotation.id
      );
    },
    showMissingButton() {
      return (
        !this.editAnnotation &&
        this.hoveredAnnotation &&
        !this.isAnnotationInEditMode(this.currentAnnotationId()) &&
        !this.annotation &&
        !this.annotationIsNotFound(this.annotationSet, this.label)
      );
    },
    showRestoreButton() {
      return (
        !this.editAnnotation &&
        this.hoveredAnnotation &&
        !this.isLoading &&
        !this.isAnnotationInEditMode(this.currentAnnotationId()) &&
        this.annotationIsNotFound(this.annotationSet, this.label)
      );
    },
    showCancelButton() {
      if (!this.editAnnotation || this.isLoading) {
        return false;
      }
      return this.isAnnotationInEditMode(this.currentAnnotationId());
    },
    showSaveButton() {
      if (!this.editAnnotation || this.isLoading) return false;

      // Check if it's an Annotation or Empty Annotation
      if (this.isAnnotation) {
        return true;
      } else {
        if (!this.isAnnotationInEditMode(this.currentAnnotationId())) return;

        return (
          this.elementSelected === this.currentAnnotationId() &&
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
        this.labelSet.id,
        this.annotationSet.id,
        false
      );
    },
    handleSaveChanges(decline = false) {
      if (this.publicView || this.isDocumentReviewed) return;

      // Verify if we are editing a filled or empty annotation
      if (
        this.annotation &&
        (this.showAcceptButton() ||
          this.showDeclineButton() ||
          this.isAnnotationInEditMode(
            this.currentAnnotationId(),
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
            canCancel: ["button"],
            message: this.$t("edit_ann_content_warning"),
            onConfirm: () => this.saveAnnotationChanges(spans, decline),
            onCancel: () => this.handleCancelButton(),
          });
        } else {
          this.saveAnnotationChanges(spans, decline);
        }
      } else if (
        !this.annotation &&
        this.isAnnotationInEditMode(this.currentAnnotationId())
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
          item.label_set === this.labelSet.id
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
      setTimeout(() => {
        this.isLoading = true;
      }, 100);

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

      if (this.annotationSet && this.annotationSet.id) {
        annotationToCreate = {
          document: this.documentId,
          span: this.spanSelection,
          label: this.label.id,
          annotation_set: this.annotationSet.id,
          is_correct: true,
          revised: false,
        };
      } else {
        // if annotation set id is null
        annotationToCreate = {
          document: this.documentId,
          span: this.spanSelection,
          label: this.label.id,
          label_set: this.labelSet.id,
          is_correct: true,
          revised: false,
        };
      }
      this.isLoading = true;

      this.$store
        .dispatch("document/createAnnotation", {
          annotation: annotationToCreate,
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
      this.isLoading = false;
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
            annotation.label_set === this.labelSet.id &&
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
      if (this.label) {
        this.$store.dispatch("display/enableSearch", true);
        this.$store.dispatch("display/setCurrentSearch", this.label.name);
      }
    },
    copyAnnotationLink() {
      if (this.annotation) {
        this.$store.dispatch("document/setAnnotationId", this.annotation.id);
        navigator.clipboard.writeText(window.location.href);
        this.$buefy.toast.open({
          container: "#app .dv-ui-app-container",
          message: this.$t("copied"),
        });
      }
    },
    selectAnnotation(event) {
      event.stopPropagation();
      if (this.annotation) {
        this.$store.dispatch("document/setAnnotationId", this.annotation.id);
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
