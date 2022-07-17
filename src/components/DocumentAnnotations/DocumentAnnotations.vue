<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <div ref="annotationsList" class="label-info">
    <div v-if="!recalculatingAnnotations">
      <div class="label-group">
        <div
          v-for="(annotationSet, indexGroup) in annotationSets"
          v-bind:key="indexGroup"
        >
          <div class="label-set-name">{{ annotationSet.label_set.name }}</div>
          <div v-for="label in annotationSet.labels" v-bind:key="label.id">
            <div
              v-for="(annotation, index) in label.annotations"
              v-bind:key="index"
              :class="[
                'label-properties',
                annotation.id &&
                  sidebarAnnotationSelected &&
                  annotation.id === sidebarAnnotationSelected.id &&
                  'selected'
              ]"
              :ref="`annotation${annotation && annotation.id}`"
              @mouseenter="onLabelHover(annotation, label)"
              @mouseleave="onLabelHover(null)"
            >
              <div class="label-property-left" v-if="annotation">
                <LabelDetails
                  :description="label.description"
                  :accuracy="annotation.confidence"
                  :notFound="!annotation.span"
                  :accepted="annotation.revised && annotation.is_correct"
                  :edited="
                    (!annotation.revised && annotation.is_correct) ||
                    annotation.created_by
                  "
                  :user="annotation.created_by || annotation.revised_by"
                />
                <div class="label-property-name">
                  <span class="label-property-text">{{ label.name }} </span>
                </div>
              </div>
              <div class="label-property-right">
                <div class="label-property-annotation">
                  <Annotation
                    v-if="
                      annotation.span !== undefined &&
                      annotation.span[0].offset_string
                    "
                    :annotation="annotation"
                    :isLoading="isLoading"
                    :edited="edited"
                    :notEditing="notEditing"
                    :annBeingEdited="annBeingEdited"
                    :isAnnotationBeingEditedNull="isAnnotationBeingEditedNull"
                    @handle-data-changes="handleDataChanges"
                    @handle-show-warning="handleWarning"
                    @handle-show-error="handleError"
                  />
                  <EmptyAnnotation
                    v-else
                    :annotation="annotation"
                    :annotationSet="annotationSet"
                  />
                </div>
              </div>
              <transition name="slide-fade">
                <div
                  v-if="showWarning"
                  :class="[
                    'message',
                    !notEditing &&
                      annotation.id !== annBeingEdited.id &&
                      'hidden'
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
              </transition>
              <transition name="slide-fade">
                <div
                  v-if="showError"
                  :class="[
                    'message',
                    !edited && annotation.id !== annBeingEdited.id && 'hidden'
                  ]"
                >
                  <b-message class="is-danger">
                    <div class="message-container">
                      {{ $t("error_message") }}
                      <div @click="handleErrorClose" class="btn-container">
                        <b-icon icon="xmark" class="close-btn" />
                      </div>
                    </div>
                  </b-message>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- When label is rejected -->
    <!-- <div v-if="rejected.length > 0" class="rejected-labels">
      <RejectedLabels />
    </div> -->
    <!-- When there's no annotations in the label -->
    <div v-if="!annotationSets || !annotationSets.length > 0">
      <EmptyState />
    </div>

    <!-- When extracting annotations after rotating -->
    <div v-if="recalculatingAnnotations">
      <ExtractingData />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import EmptyState from "./EmptyState";
import Annotation from "./Annotation";
import EmptyAnnotation from "./EmptyAnnotation";
import ExtractingData from "./ExtractingData";
import CaretDown from "../../assets/images/CaretDownImg";
import ActionButtons from "./ActionButtons";
import RejectedLabels from "./RejectedLabels";
import LabelDetails from "./LabelDetails";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    Annotation,
    EmptyAnnotation,
    ExtractingData,
    CaretDown,
    ActionButtons,
    RejectedLabels,
    LabelDetails
  },
  data() {
    return {
      annotationAnimationTimeout: null,
      showWarning: false,
      notEditing: true,
      annBeingEdited: null,
      edited: false,
      showError: false,
      isLoading: false,
      menu: true
    };
  },
  computed: {
    ...mapState("document", [
      "sidebarAnnotationSelected",
      "loading",
      "recalculatingAnnotations",
      "annotationSets"
    ])
  },
  methods: {
    handleDataChanges({ annotation, notEditing, edited, isLoading }) {
      if (annotation !== null) {
        this.annBeingEdited = annotation;
      }

      if (notEditing !== null) {
        this.notEditing = notEditing;
      }

      if (edited !== null) {
        this.edited = edited;
      }

      if (isLoading !== null) {
        this.isLoading = isLoading;
      }
    },
    onLabelHover(annotation, label) {
      if (label) {
        annotation.label_name = label.name;
      }
      this.$store.dispatch("document/setDocumentFocusedAnnotation", annotation);
    },
    isAnnotationBeingEditedNull() {
      if (this.annBeingEdited.id === null) {
        return false;
      } else {
        return this.annBeingEdited.id;
      }
    },
    handleError(value) {
      this.showError = value;
    },
    handleWarning(value) {
      this.showWarning = value;
    },
    handleWarningClose() {
      this.showWarning = false;
    },
    handleErrorClose() {
      this.showError = false;
    }
  },
  watch: {
    sidebarAnnotationSelected() {
      // if an annotation is selected, scroll to it
      if (this.sidebarAnnotationSelected) {
        clearTimeout(this.annotationAnimationTimeout);
        setTimeout(() => {
          if (
            this.$refs[`annotation${this.sidebarAnnotationSelected.id}`] ===
            undefined
          ) {
            return;
          }
          this.$refs.annotationsList.scrollTo({
            top: this.$refs[`annotation${this.sidebarAnnotationSelected.id}`][0]
              .offsetTop,
            behavior: "smooth"
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
