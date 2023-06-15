<template>
  <div class="empty-annotation">
    <span
      v-if="!publicView && !isDocumentReviewed"
      :id="emptyAnnotationId()"
      ref="emptyAnnotation"
      :class="[
        'annotation-value',
        showActionError &&
          editAnnotation &&
          editAnnotation.id === emptyAnnotationId() &&
          'error-editing',
        !isEmptyAnnotationEditable() && !isMissingAnnotation && 'label-empty',
        isAnnotationBeingEdited() && 'clicked',
        isMissingAnnotation && 'missing-annotation',
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @keypress.enter="saveEmptyAnnotationChanges"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
      ><!-- eslint-disable vue/no-v-html -->
      <span
        v-if="isFindingAnnotation"
        v-html="$t('draw_box_document', { label_name: label.name })"
      >
      </span>
      <span v-else-if="isMissingAnnotation" class="not-found-text">
        {{ $t("missing_from_document") }}
      </span>
      <span
        v-else-if="span && span.offset_string && isEmptyAnnotationEditable()"
      >
        {{ span.offset_string }}
      </span>
      <span v-else>
        {{ $t("no_data_found") }}
      </span>
      <!--eslint-enable-->
    </span>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
import { isElementArray } from "../../utils/utils";

/**
 * This component is responsible for managing empty annotations (labels with no annotations).
 */
export default {
  name: "EmptyAnnotation",
  props: {
    label: {
      type: Object,
      required: true,
    },
    annotationSet: {
      type: Object,
      required: true,
    },
    span: {
      type: Object,
      default: null,
      required: false,
    },
    spanIndex: {
      type: Number,
      required: false,
      default: 0,
    },
    saveChanges: {
      type: Boolean,
      required: false,
    },
    isMissingAnnotation: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode", "isDocumentReviewed"]),
    ...mapState("selection", ["spanSelection", "elementSelected"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "showActionError",
    ]),
    isFindingAnnotation() {
      return (
        this.editAnnotation &&
        this.editAnnotation.id === this.emptyAnnotationId() &&
        (!this.span || !this.span.offset_string)
      );
    },
  },

  watch: {
    span(newValue) {
      if (this.elementSelected === this.emptyAnnotationId() && newValue) {
        if (isElementArray(newValue))
          newValue.map((span) => {
            if (span.offset_string) {
              span.offset_string =
                this.$refs.emptyAnnotation.textContent.trim();
              span.offset_string_original =
                this.$refs.emptyAnnotation.textContent.trim();
            }
          });
      }
    },
    spanSelection(newValue) {
      if (!newValue) return;

      //   // Check if the bbox has no string
      if (newValue[0] && !newValue[0].offset_string) {
        this.$store.dispatch("document/resetEditAnnotation");
        this.$store.dispatch("selection/disableSelection");
      }
    },
  },

  methods: {
    emptyAnnotationId() {
      if (!this.annotationSet || !this.label) return;

      if (this.annotationSet.id) {
        return `${this.annotationSet.id}_${this.label.id}`;
      } else {
        return `${this.annotationSet.label_set.id}_${this.label.id}`;
      }
    },
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.emptyAnnotationId());
    },
    handleEditEmptyAnnotation() {
      if (
        this.publicView ||
        this.isDocumentReviewed ||
        this.isMissingAnnotation
      )
        return;

      if (
        !this.publicView &&
        !this.isDocumentReviewed &&
        this.elementSelected !== this.emptyAnnotationId()
      ) {
        this.$store.dispatch("selection/disableSelection");
        this.$store.dispatch("selection/setSelectedEntities", null);
        this.$store.dispatch(
          "selection/selectElement",
          this.emptyAnnotationId()
        );

        this.$store.dispatch("document/setEditAnnotation", {
          id: this.emptyAnnotationId(),
          index: this.spanIndex,
          label: this.label.id,
          labelSet: this.annotationSet.label_set.id,
          annotationSet: this.annotationSet.id,
        });
      }
    },
    isEmptyAnnotationEditable() {
      if (
        (this.spanSelection && this.spanSelection[this.spanIndex] === 0) ||
        this.isMissingAnnotation
      ) {
        return false;
      } else {
        return (
          this.elementSelected === this.emptyAnnotationId() &&
          this.spanSelection &&
          this.spanSelection[this.spanIndex] &&
          this.spanSelection[this.spanIndex].offset_string != null
        );
      }
    },
    saveEmptyAnnotationChanges(event) {
      if (this.publicView || this.isDocumentReviewed) return;

      if (event) {
        event.preventDefault();
      }

      // API call handled in parent component - AnnotationRow
      this.$emit("save-empty-annotation-changes");
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
