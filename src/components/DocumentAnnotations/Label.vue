<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div>
    <div
      :class="[
        'label-properties',
        isSelected && 'selected',
        editing && 'editing'
      ]"
      @click="onLabelClick"
      @mouseenter="onLabelHoverEnter"
      @mouseleave="onLabelHoverLeave"
    >
      <div class="label-property-left">
        <LabelDetails
          :description="label.description"
          :annotation="annotation"
        />
        <div class="label-property-name">
          <span class="label-property-text">{{ label.name }} </span>
        </div>
      </div>
      <div class="label-property-right">
        <div class="label-property-annotation">
          <div v-if="annotation">
            <Annotation
              v-for="(span, index) in annotation.span"
              :key="index"
              :annotation="annotation"
              :span="span"
              :spanIndex="index"
              :label="label"
              :annotationSet="annotationSet"
            />
          </div>
          <EmptyAnnotation
            v-else
            :label="label"
            :annotationSet="annotationSet"
            @reject="handleReject"
          />
        </div>
        <div
          class="label-group-info"
          v-if="annotation && annotation.groupedAnnotations"
          @click.stop="showAnnotationsGroup = !showAnnotationsGroup"
        >
          <span class="group-number">{{
            annotation.groupedAnnotations.length
          }}</span>
          <b-icon
            :icon="showAnnotationsGroup ? 'angle-up' : 'angle-down'"
            class="is-small"
          />
        </div>
      </div>
    </div>
    <div class="label-group" v-show="showAnnotationsGroup">
      <slot name="groupedAnnotations"></slot>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import LabelDetails from "./LabelDetails";
import Annotation from "./Annotation";
import EmptyAnnotation from "./EmptyAnnotation";

/**
 * This component shows each label and its annotations
 */
export default {
  name: "Label",
  components: { LabelDetails, Annotation, EmptyAnnotation },
  props: {
    label: {
      required: true
    },
    annotationSet: {
      required: true
    },
    annotation: {
      required: false,
      default: null
    },
    editing: {
      required: false,
      default: false
    },
    parentGroupAnnotation: {
      required: false,
      default: null
    }
  },
  data() {
    return {
      isLoading: false,
      isSelected: false,
      annotationAnimationTimeout: null,
      showAnnotationsGroup: false
    };
  },
  computed: {
    ...mapState("document", [
      "documentFocusedAnnotation",
      "sidebarAnnotationSelected",
      "editAnnotation",
      "annotationSets"
    ])
  },
  methods: {
    onLabelHoverEnter() {
      if (this.annotation) {
        this.$emit("handle-scroll", false);
        const focusedAnnotation = { ...this.annotation };
        focusedAnnotation.label_name = this.label.name;
        this.$store.dispatch(
          "document/setDocumentFocusedAnnotation",
          focusedAnnotation
        );
      }
    },
    onLabelHoverLeave() {
      this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
    },
    onLabelClick() {
      if (this.documentFocusedAnnotation && this.annotation) {
        this.$emit("handle-scroll", true);
      }
    },
    handleReject() {
      if (!this.label || !this.annotationSet) return;

      const labelId = this.label.id;
      const labelSetId = this.annotationSet.label_set.id;

      this.$emit("handle-reject", labelId, labelSetId);
    }
  },
  watch: {
    documentFocusedAnnotation(newValue) {
      if (newValue && this.editAnnotation.id === newValue.id) {
        this.onLabelClick();
      }
    },
    sidebarAnnotationSelected(newSidebarAnnotationSelected) {
      if (newSidebarAnnotationSelected && this.annotation) {
        if (this.annotation.groupedAnnotations) {
          // if is an annotation inside the group, we need to open the group
          const isAnnotationInGroup = this.annotation.groupedAnnotations.find(
            groupAnnotation => {
              return groupAnnotation.id === newSidebarAnnotationSelected.id;
            }
          );
          if (isAnnotationInGroup) {
            this.showAnnotationsGroup = true;
          }
        }

        if (this.annotation.id === newSidebarAnnotationSelected.id) {
          clearTimeout(this.annotationAnimationTimeout);

          const runAnimation = () => {
            this.$el.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest"
            });
            this.isSelected = true;
            // remove annotation selection after some time
            this.annotationAnimationTimeout = setTimeout(() => {
              this.$store.dispatch(
                "document/setSidebarAnnotationSelected",
                null
              );
              this.isSelected = false;
              this.$emit("handle-scroll", false);
            }, 1500);
          };

          if (this.parentGroupAnnotation) {
            // run in next render because we need the parent annotation to open the group
            this.$nextTick(runAnimation);
          } else {
            runAnimation();
          }
        }
      }
    }
  }
};
</script>
