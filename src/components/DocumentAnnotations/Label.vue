<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="labels" ref="label">
    <div
      v-for="annotation in annotations"
      :key="annotationId(annotation)"
      :class="[
        'label-properties',
        isAnnotationSelected(annotation) && 'selected',
        isAnnotationInEditMode(annotationId(annotation)) && 'editing'
      ]"
      :ref="`label_${label.id}_${annotationSet.id}`"
      @click="onLabelClick(true)"
      @mouseenter="onLabelHover(true, annotation)"
      @mouseleave="onLabelHover(false, annotation)"
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
          <Annotation
            v-if="annotation"
            :annotation="annotation"
            :isLoading="isLoading"
            @handle-data-changes="handleDataChanges"
            :handleShowError="handleShowError"
            :handleMessage="handleMessage"
          />
          <EmptyAnnotation
            v-else
            :label="label"
            :annotationSet="annotationSet"
            :isLoading="isLoading"
            @handle-data-changes="handleDataChanges"
            :handleShowError="handleShowError"
            :handleMessage="handleMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import LabelDetails from "./LabelDetails";
import Annotation from "./Annotation";
import EmptyAnnotation from "./EmptyAnnotation";
/**
 * This component shows each label
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
    handleScroll: {
      type: Function
    },
    handleMessage: {
      type: Function
    },
    handleShowError: {
      type: Function
    }
  },
  computed: {
    ...mapState("document", ["documentFocusedAnnotation"]),
    ...mapGetters("document", ["isAnnotationInEditMode"]),
    labelHasAnnotations() {
      return (
        this.label &&
        this.label.annotations &&
        this.label.annotations.length > 0
      );
    },
    annotations() {
      if (this.labelHasAnnotations) {
        return this.label.annotations;
      } else {
        return [null];
      }
    }
    // annotation() {
    //   if (this.labelHasAnnotations) {
    //     return this.label.annotations[0];
    //   } else {
    //     return null;
    //   }
    // }
  },
  data() {
    return {
      edited: false,
      showError: false,
      isLoading: false,
      annotationAnimationTimeout: null
    };
  },
  methods: {
    annotationId(annotation) {
      return annotation
        ? annotation.id
        : `${this.annotationSet.id}_${this.label.id}`;
    },
    handleDataChanges({ annotation, isLoading }) {
      if (annotation !== null) {
        if (!this.labelHasAnnotations) {
          this.label.annotations = [annotation];
        }
      }

      if (isLoading !== null) {
        this.isLoading = isLoading;
      }
    },
    onLabelHover(value, annotation) {
      if (value) {
        this.handleScroll(!value);
      }

      if (annotation && value) {
        const focusedAnnotation = { ...annotation };
        focusedAnnotation.label_name = this.label.name;
        this.$store.dispatch(
          "document/setDocumentFocusedAnnotation",
          focusedAnnotation
        );
      } else {
        this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
      }
    },
    onLabelClick(value) {
      if (value && this.documentFocusedAnnotation) {
        this.handleScroll(value);
      }
    },
    isAnnotationSelected(annotation) {
      if (annotation) {
        return (
          this.sidebarAnnotationSelected &&
          annotation.id === this.sidebarAnnotationSelected.id
        );
      }
      return false;
    },
    handleError(value) {
      this.showError = value;
    },
    handleErrorClose() {
      this.showError = false;
    }
  },
  watch: {
    sidebarAnnotationSelected() {
      // if an annotation is selected, scroll to it
      if (
        this.sidebarAnnotationSelected &&
        this.annotation &&
        this.annotations.find(
          annotation =>
            annotation && this.sidebarAnnotationSelected.id === annotation.id
        )
      ) {
        const refId = `label_${this.label.id}_${this.annotationSet.id}`;
        clearTimeout(this.annotationAnimationTimeout);
        setTimeout(() => {
          if (this.$refs[`${refId}`] === undefined) {
            return;
          }

          this.$refs[`${refId}`].scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
          });

          // remove annotation selection after some time
          this.annotationAnimationTimeout = setTimeout(() => {
            this.$store.dispatch("document/setSidebarAnnotationSelected", null);
            this.handleScroll(false);
          }, 1500);
        }, 100);
        // add a timeout in case we need to wait if a tab is going to be changed
      }
    }
  }
};
</script>
