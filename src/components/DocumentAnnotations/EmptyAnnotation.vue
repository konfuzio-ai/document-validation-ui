<template>
  <div v-if="!publicView && !isDocumentReviewed" class="empty-annotation">
    <span
      :id="emptyAnnotationId()"
      ref="emptyAnnotation"
      :class="[
        'annotation-value',
        showActionError && isAnnotationBeingEdited() && 'error-editing',
        isAnnotationBeingEdited() && 'clicked-ann',
        isMissingAnnotation && 'missing-annotation',
        !isMissingAnnotation && 'keyboard-nav',
      ]"
      :contenteditable="isAnnotationBeingEdited()"
      @keypress.enter="saveEmptyAnnotationChanges"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
      ><!-- eslint-disable vue/no-v-html -->
      <span
        v-if="isFindingAnnotation"
        class="label-empty-clicked"
        v-html="$t('draw_box_document', { label_name: label.name })"
      >
      </span>
      <span v-else-if="isMissingAnnotation" class="not-found-text">
        {{ $t("missing_from_document") }}
      </span>
      <span v-else-if="span && span.offset_string">
        {{ span.offset_string }}
      </span>
      <span v-else class="label-empty">
        {{ $t("no_data_found") }}
      </span>
      <!--eslint-enable-->
    </span>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";

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
      default: null,
    },
    labelSet: {
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
    isMissingAnnotation: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  computed: {
    ...mapGetters("document", ["isAnnotationInEditMode", "isDocumentReviewed"]),
    ...mapState("selection", ["spanSelection"]),
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
      // if (newValue) {
      //   if (isElementArray(newValue))
      //     newValue.map((span) => {
      //       if (span.offset_string) {
      //         span.offset_string =
      //           this.$refs.emptyAnnotation.textContent.trim();
      //         span.offset_string_original =
      //           this.$refs.emptyAnnotation.textContent.trim();
      //       }
      //     });
      // }
    },
    spanSelection(newValue) {
      if (!newValue) return;

      // Check if the bbox has no string
      if (newValue[0] && !newValue[0].offset_string) {
        this.$store.dispatch("document/resetEditAnnotation");
        this.$store.dispatch("selection/disableSelection");
      }
    },
  },

  methods: {
    emptyAnnotationId() {
      if ((!this.annotationSet && !this.labelSet) || !this.label) return;
      const id =
        this.annotationSet && this.annotationSet.id != null
          ? this.annotationSet.id
          : this.labelSet.id;
      return `${id}_${this.label.id}`;
    },
    isAnnotationBeingEdited() {
      return this.isAnnotationInEditMode(this.emptyAnnotationId());
    },
    handleEditEmptyAnnotation() {
      if (this.isMissingAnnotation) return;
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("document/setEditAnnotation", {
        id: this.emptyAnnotationId(),
        index: this.spanIndex,
        label: this.label,
        labelSet: this.labelSet,
        annotationSet: this.annotationSet,
      });
    },
    saveEmptyAnnotationChanges(event) {
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
