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
      isAnnotationInEditMode(annotationId()) && 'editing'
    ]"
    @click="onAnnotationClick"
    @mouseenter="onAnnotationHoverEnter"
    @mouseleave="onAnnotationHoverLeave"
  >
    <div class="annotation-row-left">
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
        <div v-else>
          <EmptyAnnotation
            :label="label"
            :annotationSet="annotationSet"
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
      annotationAnimationTimeout: null
    };
  },
  computed: {
    ...mapState("document", [
      "documentFocusedAnnotation",
      "editAnnotation",
      "sidebarAnnotationSelected"
    ]),
    ...mapGetters("document", ["isAnnotationInEditMode"])
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
    onAnnotationHoverEnter() {
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
    onAnnotationHoverLeave() {
      this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
    },
    handleReject() {
      // TODO: this should be dispatched here and not in document annotations
      this.$emit("handle-reject");
    },
    onAnnotationClick() {
      // TODO: this should be refactored to a store dispatch
      if (this.documentFocusedAnnotation && this.annotation) {
        this.$emit("handle-scroll", true);
      }
    }
  },
  watch: {
    documentFocusedAnnotation(newValue) {
      if (newValue && this.editAnnotation.id === newValue.id) {
        this.onAnnotationClick();
      }
    },
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
            this.$emit("handle-scroll", false);
          }, 1500);
        };
        runAnimation();
      }
    }
  }
};
</script>
