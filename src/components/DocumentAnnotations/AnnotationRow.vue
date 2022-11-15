<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div
    :class="[
      'annotation-row',
      isSelected && 'selected',
      isAnnotationInEditMode(annotationId()) && 'editing',
      hoveredAnnotationSet &&
        hoveredAnnotationSet.type == 'reject' &&
        annotationSet.id === hoveredAnnotationSet.annotationSet.id &&
        annotationSet.label_set.id ===
          hoveredAnnotationSet.annotationSet.label_set.id &&
        hoveredEmptyLabels() === label.id &&
        'hovered-empty-labels',
      hoveredAnnotationSet &&
        hoveredAnnotationSet.type == 'accept' &&
        annotation &&
        hoveredPendingAnnotations() === annotation.id &&
        'hovered-pending-annotations'
    ]"
    @click="onAnnotationClick"
    @mouseover="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div
      class="annotation-row-left"
      @mouseenter="onAnnotationHoverEnter(defaultSpan)"
      @mouseleave="onAnnotationHoverLeave"
    >
      <AnnotationDetails
        :description="label.description"
        :annotation="annotation"
      />
      <div class="label-name">
        <span>{{ label.name }} </span>
      </div>
    </div>
    <div class="annotation-row-right">
      <div class="annotation-content">
        <div v-if="annotation">
          <div
            @mouseenter="onAnnotationHoverEnter(span)"
            @mouseleave="onAnnotationHoverLeave"
            v-for="(span, index) in spanForEditing
              ? spanSelection
              : annotation.span"
            :key="index"
          >
            <Annotation
              :annotation="annotation"
              :span="span"
              :spanIndex="index"
              :label="label"
              :annotationSet="annotationSet"
              :isHovered="isHovered"
            />
          </div>
        </div>
        <div v-else>
          <div v-if="spanSelection && isAnnotationInEditMode(annotationId())">
            <EmptyAnnotation
              v-for="(span, index) in spanSelection"
              :key="index"
              :span="span"
              :spanIndex="index"
              :label="label"
              :annotationSet="annotationSet"
              :isHovered="isHovered"
              @reject="handleReject"
            />
          </div>
          <EmptyAnnotation
            v-else
            :label="label"
            :annotationSet="annotationSet"
            :isHovered="isHovered"
            @reject="handleReject"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import AnnotationDetails from "./AnnotationDetails";
import Annotation from "./Annotation";
import EmptyAnnotation from "./EmptyAnnotation";
export default {
  name: "AnnotationRow",
  components: {
    AnnotationDetails,
    Annotation,
    EmptyAnnotation
  },
  props: {
    annotationSet: {
      required: true
    },
    label: {
      required: true
    },
    annotation: {
      default: null
    }
  },
  data() {
    return {
      isLoading: false,
      isSelected: false,
      annotationAnimationTimeout: null,
      isHovered: false
    };
  },
  computed: {
    ...mapState("document", [
      "editAnnotation",
      "sidebarAnnotationSelected",
      "hoveredAnnotationSet",
      "enableGroupingFeature"
    ]),
    ...mapState("selection", ["spanSelection"]),
    ...mapGetters("document", ["isAnnotationInEditMode"]),
    ...mapGetters("selection", ["isValueArray"]),
    defaultSpan() {
      if (
        this.annotation &&
        this.annotation.span &&
        this.annotation.span.length > 0
      ) {
        return this.annotation.span[0];
      }
      return null;
    },
    spanForEditing() {
      return (
        this.spanSelection &&
        this.isValueArray(this.spanSelection) &&
        this.isAnnotationInEditMode(this.annotationId())
      );
    }
  },
  methods: {
    annotationId() {
      if (!this.annotationSet || !this.label) return;

      if (this.annotation && this.annotation.id) return this.annotation.id;

      let emptyAnnotationId;

      if (this.annotationSet.id) {
        emptyAnnotationId = `${this.annotationSet.id}_${this.label.id}`;
      } else {
        emptyAnnotationId = `${this.annotationSet.label_set.id}_${this.label.id}`;
      }
      return emptyAnnotationId;
    },
    onAnnotationHoverEnter(span) {
      if (span) {
        this.$store.dispatch("document/setDocumentAnnotationSelected", {
          annotation: this.annotation,
          label: this.label,
          span,
          scrollTo: false
        });
      }
    },
    onAnnotationHoverLeave() {
      this.$store.dispatch("document/disableDocumentAnnotationSelected");
    },
    handleReject() {
      // TODO: this should be dispatched here to the store and not in document annotations because it's going back and forward in a lot of components
      this.$emit("handle-reject");
    },
    onAnnotationClick() {
      this.$store.dispatch("document/scrollToDocumentAnnotationSelected");
    },
    hoveredEmptyLabels() {
      if (!this.hoveredAnnotationSet) return;

      const labels = this.hoveredAnnotationSet.annotationSet.labels.map(
        label => {
          return JSON.parse(JSON.stringify(label));
        }
      );
      const found = labels.find(l => l.id === this.label.id);
      if (found && found.annotations.length === 0) return found.id;
      return null;
    },
    hoveredPendingAnnotations() {
      if (!this.hoveredAnnotationSet) return;

      const annotations =
        this.hoveredAnnotationSet.annotationSet.labels.flatMap(label => {
          return label.annotations;
        });

      // Check if there are no annotations OR if there are annotations for the same label (grouped)
      if (
        annotations.length === 0 ||
        (this.label.annotations.length > 1 && this.enableGroupingFeature)
      )
        return;

      const found = annotations.find(
        ann => ann.id === this.annotation.id && !ann.revised
      );

      if (found) {
        return found.id;
      } else {
        return null;
      }
    }
  },
  watch: {
    sidebarAnnotationSelected(newSidebarAnnotationSelected) {
      if (
        newSidebarAnnotationSelected &&
        this.annotation &&
        this.annotation.id === newSidebarAnnotationSelected.id
      ) {
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
            this.$store.dispatch("document/setSidebarAnnotationSelected", null);
            this.isSelected = false;
          }, 1500);
        };
        runAnimation();
      }
    }
  }
};
</script>
