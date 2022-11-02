<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="label">
    <div v-if="isMultipleAnnotations">
      <div class="label-group" @click.stop="toggleGroup">
        <div class="label-group-left">
          <b-icon
            :icon="showAnnotationsGroup ? 'angle-up' : 'angle-down'"
            class="is-small"
          />
          <div class="label-name">
            <span>{{ `${label.name} (${label.annotations.length})` }}</span>
          </div>
        </div>
        <div class="label-group-right">Accept/Reject Info</div>
      </div>
      <div v-if="showAnnotationsGroup" class="label-group-annotation-list">
        <AnnotationRow
          v-for="annotation in label.annotations"
          :key="annotation.id"
          :annotation="annotation"
          :label="label"
          :annotationSet="annotationSet"
          @handle-scroll="handleScroll"
          @handle-reject="handleReject"
        />
      </div>
    </div>
    <div v-else>
      <AnnotationRow
        :annotation="singleAnnotation"
        :label="label"
        :annotationSet="annotationSet"
        @handle-scroll="handleScroll"
        @handle-reject="handleReject"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AnnotationRow from "./AnnotationRow";

/**
 * This component shows each label and its annotations
 */
export default {
  name: "Label",
  components: { AnnotationRow },
  props: {
    label: {
      required: true
    },
    annotationSet: {
      required: true
    },
    handleScroll: {
      type: Function
    }
  },
  data() {
    return {
      isMultipleAnnotations:
        this.label.annotations && this.label.annotations.length > 1,
      showAnnotationsGroup: false
    };
  },
  computed: {
    ...mapState("document", ["sidebarAnnotationSelected"]),
    singleAnnotation() {
      if (this.label.annotations.length > 0) {
        return this.label.annotations[0];
      }
      return null;
    }
  },
  methods: {
    handleReject() {
      if (!this.label || !this.annotationSet) return;

      const labelId = this.label.id;
      const labelSetId = this.annotationSet.label_set.id;

      this.$emit("handle-reject", labelId, labelSetId);
    },
    toggleGroup() {
      this.showAnnotationsGroup = !this.showAnnotationsGroup;
    }
  }
};
</script>
