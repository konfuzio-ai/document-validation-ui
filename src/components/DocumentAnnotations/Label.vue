<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="labels" ref="label">
    <div
      :class="[
        'label-properties',
        isAnnotationSelected() && 'selected',
        activeLabelId === `${label.id}-${indexGroup}` && 'editing'
      ]"
      :ref="`label_${label.id}_${annotationSet.id}`"
      @mouseenter="onLabelHover(true)"
      @mouseleave="onLabelHover(false)"
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
            v-if="annotation && annotation.is_correct && annotation.revised"
            :annotation="annotation"
            :isLoading="isLoading"
            @handle-data-changes="handleDataChanges"
            :handleShowError="handleShowError"
            :handleMessage="handleMessage"
            :onHandleEditAnnotation="onHandleEditAnnotation"
            :onStopHandleEditAnnotation="onStopHandleEditAnnotation"
            :isActive="activeLabelId === `${label.id}-${indexGroup}`"
          />
          <EmptyAnnotation
            v-else
            :label="label"
            :annotationSet="annotationSet"
            @handle-data-changes="handleDataChanges"
            :handleShowError="handleShowError"
            :handleMessage="handleMessage"
          />
        </div>
      </div>
    </div>
    <!-- <transition name="slide-fade">
      <div
        v-if="showWarning"
        :class="[
          'message',
        !isActive && 'hidden'
        ]"
      >
        <b-message class="is-warning">
          <div class="message-container">
            {{ $t("warning_message") }}
            <div @click="handleWarningClose" class="btn-container">
              <b-icon icon="xmark" class="close-btn" />
            </div>
          </div>
        </b-message>
      </div>
    </transition> -->
  </div>
</template>
<script>
import { mapState } from "vuex";
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
    handleShowError: {
      type: Function
    },
    handleMessage: {
      type: Function
    },
    activeLabelId: {
      type: String
    },
    setActiveLabelId: {
      type: Function
    },
    indexGroup: {
      type: Number
    }
  },
  computed: {
    ...mapState("document", ["sidebarAnnotationSelected"]),
    labelHasAnnotations() {
      return (
        this.label &&
        this.label.annotations &&
        this.label.annotations.length > 0
      );
    },
    annotation() {
      if (this.labelHasAnnotations) {
        return this.label.annotations[0];
      } else {
        return null;
      }
    }
  },
  data() {
    return {
      edited: false,
      showWarning: false,
      showError: false,
      isLoading: false,
      annotationAnimationTimeout: null
    };
  },
  methods: {
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
    onLabelHover(show) {
      if (this.annotation && show) {
        const annotation = { ...this.annotation };
        annotation.label_name = this.label.name;
        this.$store.dispatch(
          "document/setDocumentFocusedAnnotation",
          annotation
        );
      } else {
        this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
      }
    },
    isAnnotationSelected() {
      if (this.annotation) {
        return (
          this.sidebarAnnotationSelected &&
          this.annotation.id === this.sidebarAnnotationSelected.id
        );
      }
      return false;
    },
    // handleWarning(value) {
    //   this.showWarning = value;
    // },
    // handleWarningClose() {
    //   this.showWarning = false;
    // },
    handleError(value) {
      this.showError = value;
    },
    handleErrorClose() {
      this.showError = false;
    },
    onHandleEditAnnotation() {
      this.setActiveLabelId(`${this.label.id}-${this.indexGroup}`);
    },
    onStopHandleEditAnnotation() {
      this.setActiveLabelId(null);
    }
  },
  watch: {
    sidebarAnnotationSelected() {
      // if an annotation is selected, scroll to it
      if (
        this.sidebarAnnotationSelected &&
        this.annotation &&
        this.sidebarAnnotationSelected.id === this.annotation.id
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
          }, 1500);
        }, 100);
        // add a timeout in case we need to wait if a tab is going to be changed
      }
    }
  }
};
</script>
