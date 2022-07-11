<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>
<template>
  <div ref="labelsList" class="label-info">
    <div v-if="activeAnnotationSet && !recalculatingAnnotations">
      <p class="label-description">
        {{ activeAnnotationSet.label_set.description }}
      </p>
      <div class="label-group">
        <div
          v-for="(annotationSet, indexGroup) in activeAnnotationSet.group"
          v-bind:key="indexGroup"
        >
          <div
            class="label-group-name"
            v-if="activeAnnotationSet.group.length > 1"
          >
            {{ `${annotationSet.label_set.name} ${indexGroup + 1}` }}
          </div>
          <div
            :class="[
              'label-properties',
              annotation.id &&
                sidebarAnnotationSelected &&
                annotation.id === sidebarAnnotationSelected.id &&
                'selected'
            ]"
            :ref="`annotation${annotation && annotation.id}`"
            v-for="annotation in annotationsInAnnotationSet(annotationSet)"
            v-bind:key="annotation.id"
            @mouseenter="onLabelHover(annotation, annotationSet)"
            @mouseleave="onLabelHover(null)"
          >
            <div class="label-property-left" v-if="annotation">
              <LabelDetails
                :description="annotation.label_description"
                :accuracy="annotation.accuracy"
                :revised="true"
                :notFound="true"
                :approved="true"
                :edited="true"
              />
              <div class="label-property-name">
                <span class="label-property-text"
                  >{{ annotation.label_name }}
                </span>
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
                    :onLabelClick="onLabelClick"
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
              <!-- <div class="label-action-btn">
                <ActionButtons :menu="menu" />
              </div> -->
            </div>
            <transition name="slide-fade">
              <div
                v-if="showWarning"
                :class="[
                  'message',
                  !notEditing && annotation.id !== annBeingEdited.id && 'hidden'
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
    <!-- When label is rejected -->
    <!-- <div v-if="rejected.length > 0" class="rejected-labels">
      <RejectedLabels />
    </div> -->
    <!-- When there's no annotations in the label -->
    <div
      v-if="
        (!activeAnnotationSet || activeAnnotationSet.labels.length == 0) &&
        !recalculatingAnnotations
      "
    >
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
      labelOpen: null,
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
    ...mapGetters("document", {
      annotationsInAnnotationSet: "annotationsInAnnotationSet"
    }),
    ...mapState("document", [
      "activeAnnotationSet",
      "sidebarAnnotationSelected",
      "loading",
      "recalculatingAnnotations"
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
    /* Clicking a label opens the description */
    onLabelClick(annotation) {
      if (this.checkIfLabelIsOpen(annotation)) {
        this.labelOpen = null;
      } else {
        this.labelOpen = annotation;
      }
    },
    checkIfLabelIsOpen(annotation) {
      // compare two objects, can't compare with ids because the label could be empty
      // and doesn't have an id
      return JSON.stringify(this.labelOpen) === JSON.stringify(annotation);
    },
    onLabelHover(annotation) {
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
    activeAnnotationSet() {
      this.labelOpen = null;
    },
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
          this.$refs.labelsList.scrollTo({
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
