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
            class="is-small caret"
          />
          <div class="label-name">
            <span>{{ `${label.name} (${label.annotations.length})` }}</span>
          </div>
        </div>
        <div class="label-group-right">
          <div class="label-annotations-pending">
            {{
              `${
                label.annotations.length - acceptedAnnotationsGroupCounter
              } ${$t("annotations_pending")}`
            }}
          </div>
          <div class="label-annotations-accepted">
            {{
              `${acceptedAnnotationsGroupCounter} ${$t("annotations_accepted")}`
            }}
          </div>
        </div>
      </div>
      <div v-if="showAnnotationsGroup" class="label-group-annotation-list">
        <AnnotationRow
          v-for="annotation in label.annotations"
          :key="annotation.id"
          :annotation="annotation"
          :label="label"
          :annotationSet="annotationSet"
          @handle-reject="handleReject"
        />
      </div>
    </div>
    <div v-else>
      <AnnotationRow
        :annotation="singleAnnotation"
        :label="label"
        :annotationSet="annotationSet"
        @handle-reject="handleReject"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
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
    }
  },
  data() {
    return {
      isMultipleAnnotations: false,
      acceptedAnnotationsGroupCounter: 0,
      showAnnotationsGroup: false
    };
  },
  computed: {
    ...mapState("document", ["sidebarAnnotationSelected"]),
    ...mapGetters("document", ["numberOfAcceptedAnnotationsInLabel"]),
    singleAnnotation() {
      if (this.label.annotations.length > 0) {
        return this.label.annotations[0];
      }
      return null;
    }
  },
  mounted() {
    this.updateValues();
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
    },
    updateValues() {
      this.isMultipleAnnotations = this.label.annotations.length > 1;
      if (this.isMultipleAnnotations) {
        this.acceptedAnnotationsGroupCounter =
          this.numberOfAcceptedAnnotationsInLabel(this.label);
      }
    }
  },
  updated() {
    this.updateValues();
  },
  watch: {
    sidebarAnnotationSelected(newSidebarAnnotationSelected) {
      // check if annotation is inside a label group and open it
      if (!this.showAnnotationsGroup && newSidebarAnnotationSelected) {
        const annotation = this.label.annotations.find(
          ann => ann.id === newSidebarAnnotationSelected.id
        );
        if (annotation) {
          this.showAnnotationsGroup = true;
          this.$store.dispatch("document/setSidebarAnnotationSelected", null);
          // run in next render because we need to open the group first
          this.$nextTick(() => {
            this.$store.dispatch(
              "document/setSidebarAnnotationSelected",
              annotation
            );
          });
        }
      }
    }
  }
};
</script>
