<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="empty-annotation">
    <span
      :class="[
        'label-property-value',
        isEmptyAnnotationEditable() ? '' : 'label-empty'
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @click="handleEditEmptyAnnotation"
      @keypress.enter="saveEmptyAnnotation"
      ref="emptyAnnotation"
      @input="isEmpty"
    >
      {{ $t("no_data_found") }}
    </span>
    <ActionButtons
      v-if="showActionButtons()"
      :saveBtn="!empty && isEmptyAnnotationEditable()"
      :cancelBtn="true"
      @save="saveEmptyAnnotation"
      @cancel="cancelEmptyAnnotation"
      :isLoading="isLoading"
      :isActive="!isLoading"
    />
  </div>
</template>
<script>
import { mapState } from "vuex";
import ActionButtons from "./ActionButtons";
/**
 * This component is responsible for managing empty annotations.
 */
export default {
  name: "EmptyAnnotation",
  data() {
    return {
      empty: false
    };
  },
  components: { ActionButtons },
  props: {
    label: {
      required: true
    },
    annotationSet: {
      required: true
    },
    isLoading: {
      type: Boolean
    }
  },
  computed: {
    ...mapState("selection", ["spanSelection", "selectionEnabled"])
  },
  methods: {
    isEmpty() {
      this.empty =
        this.$refs.emptyAnnotation &&
        this.$refs.emptyAnnotation.textContent.trim() === "";
    },
    emptyAnnotationId() {
      return `${this.annotationSet.id}_${this.label.id}`;
    },
    handleEditEmptyAnnotation() {
      if (
        !this.isLoading &&
        this.selectionEnabled !== this.emptyAnnotationId()
      ) {
        this.setText(this.$t("draw_box_document"));
        this.$store.dispatch(
          "selection/enableSelection",
          this.emptyAnnotationId()
        );
        this.$store.dispatch(
          "document/setEditAnnotation",
          this.emptyAnnotationId()
        );
      }
    },
    saveEmptyAnnotation(event) {
      if (event) {
        event.preventDefault();
      }
      // update the bbox text with the one from the input
      this.spanSelection.offset_string = this.$refs.emptyAnnotation.textContent;
      this.spanSelection.offset_string_original =
        this.$refs.emptyAnnotation.textContent;

      const annotationToCreate = {
        span: [this.spanSelection],
        label: this.label.id,
        annotation_set: this.annotationSet.id,
        is_correct: true,
        revised: true
      };
      this.$emit("handle-data-changes", {
        annotation: null,
        isLoading: true
      });
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          if (annotationCreated) {
            this.$emit("handle-data-changes", {
              annotation: annotationCreated,
              edited: false,
              isLoading: false
            });
          }
        });
      this.$store.dispatch("document/setEditAnnotation", null);
      this.$store.dispatch("selection/disableSelection");
      this.$refs.emptyAnnotation.blur();
    },
    cancelEmptyAnnotation() {
      this.$store.dispatch("document/setEditAnnotation", null);
      this.$store.dispatch("selection/disableSelection");
      this.$refs.emptyAnnotation.blur();
      this.setText(this.$t("no_data_found"));
    },
    isEmptyAnnotationEditable() {
      return (
        this.selectionEnabled === this.emptyAnnotationId() &&
        this.spanSelection &&
        this.spanSelection.offset_string != null
      );
    },
    showActionButtons() {
      return (
        this.selectionEnabled === this.emptyAnnotationId() || this.isLoading
      );
    },
    setText(text) {
      this.$refs.emptyAnnotation.textContent = text;
    }
  },
  watch: {
    spanSelection(span) {
      if (
        this.selectionEnabled === this.emptyAnnotationId() &&
        span &&
        span.offset_string
      ) {
        this.setText(span.offset_string);
      }
    }
  }
};
</script>
