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
    @mouseover="isHovered = true"
    @mouseleave="isHovered = false"
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
          <div
            @mouseenter="onAnnotationHoverEnter(span)"
            @mouseleave="onAnnotationHoverLeave"
            v-for="(span, index) in annotation.span"
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
          <EmptyAnnotation
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
    ...mapState("document", ["editAnnotation", "sidebarAnnotationSelected"]),
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
