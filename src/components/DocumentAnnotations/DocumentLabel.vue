<template>
  <div class="label">
    <div
      v-if="isGroup"
      :class="['label-group', !showAnnotationsGroup && 'keyboard-nav']"
      @click.stop="toggleGroup"
    >
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
        <div v-if="!publicView" class="label-annotations-pending">
          {{
            `${label.annotations.length - acceptedAnnotationsGroupCounter} ${$t(
              "annotations_pending"
            )}`
          }}
        </div>
        <div v-if="!publicView" class="label-annotations-accepted">
          {{
            `${acceptedAnnotationsGroupCounter} ${$t("annotations_accepted")}`
          }}
        </div>
      </div>
    </div>
    <div
      v-if="showAnnotationsGroup && annotationSet"
      :class="isGroup && 'label-group-annotation-list'"
    >
      <AnnotationRow
        v-for="(annotation, index) in hasAnnotations
          ? label.annotations
          : [singleAnnotation]"
        :key="index"
        :annotation="annotation"
        :label="label"
        :annotation-set="annotationSet"
        :label-set="annotationSet.label_set"
      />
    </div>
    <div v-else-if="showAnnotationsGroup && labelSet">
      <AnnotationRow :label="label" :label-set="labelSet" />
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
  name: "DocumentLabel",
  components: { AnnotationRow },
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
  },
  data() {
    return {
      nonMultipleAnnotationsExtracted: false,
      acceptedAnnotationsGroupCounter: 0,
      showAnnotationsGroup: false,
    };
  },
  computed: {
    ...mapState("document", [
      "annotationId",
      "enableGroupingFeature",
      "hoveredAnnotationSet",
      "publicView",
    ]),
    ...mapGetters("document", ["numberOfAcceptedAnnotationsInLabel"]),
    singleAnnotation() {
      if (this.label.annotations && this.label.annotations.length > 0) {
        return this.label.annotations[0];
      }
      return null;
    },
    hasAnnotations() {
      return this.label.annotations && this.label.annotations.length > 0;
    },
    isGroup() {
      return this.enableGroupingFeature && this.nonMultipleAnnotationsExtracted;
    },
  },
  watch: {
    annotationId(newAnnotationId) {
      this.checkAnnotationSelected(newAnnotationId);
    },
    hoveredAnnotationSet(newValue) {
      // Check if there are some unrevised Annotations within the group
      if (
        newValue &&
        newValue.type === "accept" &&
        this.labelHasPendingAnnotations(newValue)
      ) {
        this.showAnnotationsGroup = true;
      }
    },
  },
  mounted() {
    this.updateValues();
    this.checkAnnotationSelected(this.annotationId);

    if (this.publicView) {
      this.showAnnotationsGroup = true;
    }
  },
  updated() {
    this.updateValues();
  },
  methods: {
    checkAnnotationSelected(newAnnotationId) {
      // check if annotation is inside a label group and open it
      if (
        this.enableGroupingFeature &&
        !this.showAnnotationsGroup &&
        newAnnotationId
      ) {
        const annotation = this.label.annotations.find(
          (ann) => ann.id == newAnnotationId
        );

        if (annotation) {
          this.showAnnotationsGroup = true;
        }
      }
    },
    toggleGroup() {
      this.showAnnotationsGroup = !this.showAnnotationsGroup;
    },
    updateValues() {
      // more than 1 Annotation extracted for a non multiple Label
      this.nonMultipleAnnotationsExtracted =
        this.label.annotations &&
        this.label.annotations.length > 1 &&
        !this.label.has_multiple_top_candidates;

      if (this.nonMultipleAnnotationsExtracted) {
        this.acceptedAnnotationsGroupCounter =
          this.numberOfAcceptedAnnotationsInLabel(this.label);
      }
      if (!this.isGroup) {
        // if not a group then show by default
        this.showAnnotationsGroup = true;
      }
    },
    labelHasPendingAnnotations(hoveredSet) {
      if (!hoveredSet) return;

      const found = this.label.annotations.find((ann) => !ann.is_correct);

      return this.annotationSet.id === hoveredSet.annotationSet.id && found;
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
