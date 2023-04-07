<template>
  <div class="empty-annotation">
    <span
      v-if="!publicView"
      :id="emptyAnnotationId()"
      ref="emptyAnnotation"
      :class="[
        'annotation-value',
        showActionError &&
          editAnnotation &&
          editAnnotation.id === emptyAnnotationId() &&
          'error-editing',
        isEmptyAnnotationEditable() ? '' : 'label-empty',
        isAnnotationBeingEdited() && 'clicked',
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @keypress.enter="saveEmptyAnnotationChanges"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
    >
      <span v-if="span && span.offset_string && isEmptyAnnotationEditable()">
        {{ span.offset_string }}
      </span>
      <span v-else>
        {{ $t("no_data_found") }}
      </span>
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
  },
  data() {
    return {
      isLoading: false,
    };
  },
  computed: {
    ...mapGetters("document", [
      "isAnnotationInEditMode",
      "getTextFromEntities",
    ]),
    ...mapGetters("selection", ["isValueArray"]),
    ...mapState("selection", ["spanSelection", "elementSelected"]),
    ...mapState("document", [
      "editAnnotation",
      "publicView",
      "selectedEntities",
      "showActionError",
    ]),
  },
  watch: {
    span(newValue) {
      if (this.elementSelected === this.emptyAnnotationId() && newValue) {
        if (this.isValueArray(newValue))
          newValue.map((span) => {
            if (span.offset_string) {
              span.offset_string =
                this.$refs.emptyAnnotation.textContent.trim();
              span.offset_string_original =
                this.$refs.emptyAnnotation.textContent.trim();

              this.setText(span.offset_string);
            }
          });
      }
    },
    editAnnotation(newAnnotation, oldAnnotation) {
      // verify if new annotation in edit mode is not this one and if this
      // one was selected before so we set the state to the previous one (like a cancel)
      if (oldAnnotation && oldAnnotation.id === this.emptyAnnotationId()) {
        this.cancelEmptyAnnotation(true);
      }
    },
    selectedEntities(newValue) {
      if (!newValue && this.isAnnotationBeingEdited(this.emptyAnnotationId())) {
        this.setText(
          this.$t("draw_box_document", { label_name: this.label.name })
        );
        return;
      }

      if (
        newValue &&
        this.editAnnotation &&
        this.emptyAnnotationId() === this.editAnnotation.id
      ) {
        const text = this.getTextFromEntities();
        this.setText(text);
      }
    },
    spanSelection(newValue) {
      if (this.elementSelected === this.emptyAnnotationId() && newValue) {
        const isSpanArray = Array.isArray(newValue);

        // Check if the bbox is empty
        if (
          (isSpanArray && !newValue[0].offset_string) ||
          (!isSpanArray && !newValue.offset_string)
        ) {
          this.$store.dispatch("document/resetEditAnnotation");
          this.$store.dispatch("selection/disableSelection");
        }
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
      if (this.publicView) return;

      if (
        !this.publicView &&
        !this.isLoading &&
        this.elementSelected !== this.emptyAnnotationId()
      ) {
        this.setText(
          this.$t("draw_box_document", { label_name: this.label.name })
        );
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
    cancelEmptyAnnotation(wasOutsideClick = false) {
      if (wasOutsideClick) {
        this.setText(this.$t("no_data_found"));
      } else {
        this.$store.dispatch("selection/disableSelection");
      }

      this.isLoading = false;
      this.$store.dispatch("document/setSelectedEntities", null);

      if (this.$refs.emptyAnnotation) {
        this.$refs.emptyAnnotation.blur();
      }
    },
    isEmptyAnnotationEditable() {
      if (this.selectedEntities && this.selectedEntities.length > 0) {
        return (
          this.elementSelected === this.emptyAnnotationId() && !this.isLoading
        );
      } else if (
        this.spanSelection &&
        this.spanSelection[this.spanIndex] === 0
      ) {
        return false;
      } else {
        return (
          this.elementSelected === this.emptyAnnotationId() &&
          this.spanSelection &&
          this.spanSelection[this.spanIndex] &&
          this.spanSelection[this.spanIndex].offset_string != null &&
          !this.isLoading
        );
      }
    },
    saveEmptyAnnotationChanges(event) {
      if (this.publicView) return;

      if (event) {
        event.preventDefault();
      }

      // API call handled in parent component - AnnotationRow
      this.$emit("save-empty-annotation-changes");
    },
    setText(text) {
      this.$refs.emptyAnnotation.innerHTML = text;
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
