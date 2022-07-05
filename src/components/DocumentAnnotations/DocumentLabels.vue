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
            <div
              :class="[
                'label-property-top',
                annotation.label_description && 'clickable'
              ]"
              v-on:click="
                annotation.label_description && onLabelClick(annotation)
              "
              v-if="annotation"
            >
              <div class="label-property-left">
                <div class="label-property-name">
                  <CaretDown
                    :class="[
                      'icon-caret',
                      !checkIfLabelIsOpen(annotation) && 'rotated'
                    ]"
                    v-if="annotation.label_description"
                  />
                  <span
                    :class="[
                      'label-property-text',
                      !annotation.id && 'red',
                      annotation.accuracy == 0 && 'red',
                      annotation.accuracy == 1 && 'green'
                    ]"
                    >{{ annotation.label_name }}
                  </span>
                </div>
              </div>
              <div class="label-property-right">
                <div class="label-property-annotation">
                  <!-- TODO: Convert annotation to separate component like the EmptyAnnotation one 
                  and use ActionButtons with loading -->
                  <span
                    v-if="
                      annotation.span !== undefined &&
                      annotation.span[0].offset_string
                    "
                    :class="[
                      'label-property-value',
                      !notEditing &&
                        isLoading &&
                        isAnnotationBeingEditedNull() === annotation.id &&
                        'saving-changes'
                    ]"
                    role="textbox"
                    contenteditable
                    @blur="event => handleBlur(event, annotation)"
                    @paste="event => handlePaste(event, annotation)"
                    @input="event => handleInput(event, annotation)"
                    @keypress.enter="event => event.preventDefault()"
                    @click="
                      annotation.label_description && onLabelClick(annotation)
                    "
                  >
                    {{ annotation.span[0].offset_string }}
                  </span>
                  <EmptyAnnotation
                    v-else
                    :annotation="annotation"
                    :annotationSet="annotationSet"
                  />
                  <div
                    v-if="isLoading"
                    :class="[
                      'loading-container',
                      annotation.id !== annBeingEdited.id && 'hidden'
                    ]"
                  >
                    <b-notification
                      :closable="false"
                      class="loading-background"
                    >
                      <b-loading :is-full-page="isFullPage" v-model="isLoading">
                        <b-icon
                          icon="spinner"
                          class="fa-spin loading-icon-size spinner"
                        >
                        </b-icon>
                      </b-loading>
                    </b-notification>
                  </div>
                </div>
              </div>
            </div>
            <div
              :class="[
                'label-property-description',
                checkIfLabelIsOpen(annotation) && 'open'
              ]"
            >
              {{ annotation.label_description }}
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
    <!-- When there's no annotations in the label -->
    <div
      v-if="
        !activeAnnotationSet ||
        (activeAnnotationSet.labels.length == 0 && !recalculatingAnnotations)
      "
    >
      <EmptyState />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import EmptyState from "./EmptyState";
import EmptyAnnotation from "./EmptyAnnotation";
import ExtractingData from "./ExtractingData";
import CaretDown from "../../assets/images/CaretDownImg";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    EmptyAnnotation,
    ExtractingData,
    CaretDown
  },
  data() {
    return {
      labelOpen: null,
      annotationAnimationTimeout: null,
      oldValue: null,
      newValue: null,
      showWarning: false,
      notEditing: true,
      annBeingEdited: null,
      showError: false,
      edited: false,
      isFullPage: false,
      isLoading: false
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
    // Check if the user deleted or added text to the annotation
    isNewValueInOld(event, annotation) {
      this.oldValue = annotation.span[0].offset_string;
      this.newValue = event.target.textContent.trim();
      return this.oldValue.includes(this.newValue);
    },
    handlePaste(event) {
      event.preventDefault();
    },
    handleInput(event, annotation) {
      const newInOldValue = this.isNewValueInOld(event, annotation);
      this.annBeingEdited = annotation;
      this.notEditing = false;
      this.showWarning = false;
      this.showError = false;

      // If the user changes the input by adding to the existing annotation
      // we show a warning
      if (!newInOldValue || this.newValue.length === 0) {
        this.showWarning = true;
      }
    },
    handleBlur(event, annotation) {
      const spanArray = annotation.span[0];
      const id = annotation.id;
      let updatedString;

      // If the user didn't change the value, we don't want to do anything
      if (this.newValue === this.oldValue) {
        return;
      }

      this.isLoading = true;

      if (this.newValue.length === 0) {
        updatedString = {
          is_correct: false,
          revised: true
        };
      } else {
        updatedString = {
          span: [
            {
              offset_string: this.newValue,
              bottom: spanArray.bottom,
              top: spanArray.top,
              page_index: spanArray.page_index,
              x0: spanArray.x0,
              x1: spanArray.x1,
              y0: spanArray.y0,
              y1: spanArray.y1,
              start_offset: spanArray.start_offset,
              end_offset: spanArray.end_offset
            }
          ]
        };
      }

      this.$store.dispatch("document/startLoading");

      // Send to the store for the http patch request
      this.$store
        .dispatch("document/updateAnnotation", {
          updatedValues: updatedString,
          annotationId: id
        })
        .then(response => {
          // Check if the response is successfull or not
          if (response) {
            this.oldValue = this.newValue;
            this.edited = true;
          } else {
            event.target.textContent = this.oldValue;
            this.newValue = this.oldValue;
            this.showError = true;
            this.showWarning = false;
            this.edited = false;
          }
        })
        .finally(() => {
          this.$store.dispatch("document/endLoading");
          this.isLoading = false;
        });
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
