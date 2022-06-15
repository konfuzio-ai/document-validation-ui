<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <div class="empty-annotation">
    <span
      class="label-property-value label-empty"
      :contenteditable="isEmptyAnnotationEditable(annotation)"
      @click="event => handleEditEmptyAnnotation(event)"
      ref="emptyAnnotation"
    >
      {{ getEmptyAnnotationPlaceholder() }}
    </span>
    <b-button
      v-if="enableBboxes"
      class="action-button"
      type="is-primary"
      v-on:click="saveEmptyAnnotation()"
      >Save</b-button
    >
  </div>
</template>
<script>
import { mapState } from "vuex";
/**
 * This component is responsible for managing empty annotations.
 */
export default {
  name: "EmptyAnnotation",

  props: {
    annotation: {
      required: true
    }
  },
  data() {
    return {
      isEditing: false,
      // TODO: under development
      enableBboxes: false
    };
  },
  computed: {
    ...mapState("selection", ["spanSelection"]),
    ...mapState("document", ["activeAnnotationSet"])
  },
  methods: {
    handleEditEmptyAnnotation() {
      if (!this.enableBboxes) {
        return;
      }
      if (!this.isEditing) {
        this.isEditing = true;
        this.$store.dispatch("selection/enableSelection");
      }
    },
    handleCancelEmptyAnnotation() {
      if (!this.enableBboxes) {
        return;
      }
      this.$store.dispatch("selection/disableSelection");
    },
    saveEmptyAnnotation() {
      if (!this.enableBboxes) {
        return;
      }
      // TODO: if has multiple label set groups then label set should be used, otherwise annotation set id should be used.

      const annotationToCreate = {
        span: [this.spanSelection],
        label: this.annotation.label_id,
        annotation_set: this.activeAnnotationSet.id,
        is_correct: true,
        revised: true
      };
      this.$store.dispatch("document/createAnnotation", annotationToCreate);
      this.$store.dispatch("selection/disableSelection");
    },
    isEmptyAnnotationEditable() {
      if (!this.enableBboxes) {
        return false;
      }
      return (
        this.isEditing &&
        this.spanSelection &&
        !this.spanSelection.offset_string
      );
    },
    getEmptyAnnotationPlaceholder() {
      if (!this.enableBboxes) {
        return "";
      }
      if (this.isEditing) {
        if (this.spanSelection && !this.spanSelection.offset_string) {
          // the bounding box had no text result we enable the edit feature
          setTimeout(() => {
            //focus element
            this.$refs.emptyAnnotation.focus();
          }, 200);
          return "";
        } else if (this.spanSelection && this.spanSelection.offset_string) {
          return this.spanSelection.offset_string;
        } else {
          return "Please create a box on the document";
        }
      } else {
        return this.$t("no_data_found");
      }
    }
  }
};
</script>
