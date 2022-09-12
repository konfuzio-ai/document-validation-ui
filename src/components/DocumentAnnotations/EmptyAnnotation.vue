<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="empty-annotation">
    <span
      :class="[
        'annotation-value',
        isEmptyAnnotationEditable() ? '' : 'label-empty',
        isEmptyAnnotationEditable() && clicked && 'clicked'
      ]"
      :contenteditable="isEmptyAnnotationEditable()"
      @keypress.enter="saveEmptyAnnotation"
      ref="emptyAnnotation"
      @input="isEmpty"
      @click="handleEditEmptyAnnotation"
      @focus="handleEditEmptyAnnotation"
      @keyup.esc="cancelEmptyAnnotation"
    >
      {{ $t("no_data_found") }}
    </span>
    <ActionButtons
      v-if="showActionButtons()"
      :saveBtn="!empty && isEmptyAnnotationEditable()"
      :cancelBtn="true"
      :menu="false"
      @save="saveEmptyAnnotation"
      @cancel="cancelEmptyAnnotation"
      :isLoading="isLoading"
      :isActive="!isLoading"
    />
    <ActionButtons
      v-else
      :menu="true"
      :cancelBtn="false"
      :saveBtn="false"
      :isActive="!isLoading"
      :isLoading="isLoading"
      @handle-menu="handleMenu"
      :label="label"
      :annotationSet="annotationSet"
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
      empty: false,
      isLoading: false,
      clicked: false
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
    handleMenu: {
      type: Function
    }
  },
  computed: {
    ...mapState("selection", ["spanSelection", "selectionEnabled"]),
    ...mapState("document", ["editAnnotation", "editingActive"])
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
        this.$store.dispatch("document/setEditAnnotation", {
          id: this.emptyAnnotationId()
        });
        this.$store.dispatch("document/setEditingActive", true);
        this.clicked = true;
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
      this.isLoading = true;
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          if (annotationCreated) {
            this.$emit("handle-data-changes", {
              annotation: annotationCreated,
              edited: false
            });
            this.isLoading = false;
          }
        });
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
      this.$refs.emptyAnnotation.blur();
    },
    cancelEmptyAnnotation() {
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
      this.$refs.emptyAnnotation.blur();
      this.setText(this.$t("no_data_found"));
      this.$store.dispatch("document/setEditingActive", false);
      this.clicked = false;
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
    },
    editAnnotation(newAnnotation, oldAnnotation) {
      // verify if new annotation in edit mode is not this one and if this
      // one was selected before so we set the state to the previous one (like a cancel)
      if (
        oldAnnotation &&
        newAnnotation &&
        oldAnnotation.id === this.emptyAnnotationId() &&
        oldAnnotation.id !== newAnnotation.id
      ) {
        this.$refs.emptyAnnotation.blur();
        this.setText(this.$t("no_data_found"));
      }
    },
    editingActive(newValue) {
      if (!newValue) {
        this.cancelEmptyAnnotation();
      }
    }
  }
};
</script>
