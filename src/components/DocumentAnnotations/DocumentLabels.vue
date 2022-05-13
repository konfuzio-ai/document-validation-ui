<style scoped lang="scss">
.label-info {
  font-family: "Inter", sans-serif;
  overflow: auto;
  flex: 1;
  padding: 0 16px;
  .label-title {
    font-weight: 600;
    font-size: 18px;
    color: $text;
    margin-top: 24px;
  }

  .label-description {
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: $text-lighter;
  }

  .label-group {
    cursor: default;

    .label-group-name {
      margin-top: 24px;
      margin-bottom: 8px;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: $text;
    }
  }

  .label-properties {
    width: 100%;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
    border-bottom: 1px solid $background;
    transition: background-color 0.2s ease-out;

    &:last-child {
      border-bottom: none;
    }

    &:hover,
    &.selected {
      background-color: $grey-lightest;
    }

    .label-property-top {
      display: flex;
      align-items: flex-start;

      &.clickable {
        cursor: pointer;
      }

      .label-property-left {
        flex: 1;
        padding-left: 8px;

        .label-property-name {
          padding: 10px 0;
          display: flex;
          align-items: center;

          .icon-caret {
            transition: transform 0.2s ease-in-out;

            &.rotated {
              transform: rotate(-90deg);
            }
          }
        }

        .label-property-text {
          color: $text-lighter;
          margin-left: 4px;
          width: 100%;
          border-right: 4px solid $yellow;

          &.green {
            border-color: $green;
          }

          &.red {
            border-color: $red;
          }
        }
      }

      .label-property-right {
        flex: 1;

        .label-property-annotation {
          display: flex;
          align-items: center;
          padding: 10px 0;
        }

        .label-property-value {
          color: $text;
          margin-left: 8px;
          border: none;
          background-color: transparent;
        }

        .label-property-value:focus {
          outline: none;
        }

        [contenteditable].label-property-value {
          overflow: hidden;
        }
      }

      @media (max-width: 1100px) {
        [contenteditable].label-property-value {
          word-break: break-all;
        }
      }
    }

    .label-property-description {
      padding: 0 20px;
      overflow: hidden;
      height: 0px;
      opacity: 0;
      color: $text;
      display: flex;
      align-items: center;
      background-color: $background;
      transition: height 0.2s ease-in-out, opacity 0.2s ease-in-out;

      &.open {
        height: 40px;
        opacity: 1;
      }
    }
  }

  .message {
    .message-container {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      font-size: 14px !important;
    }

    .close-btn:hover {
      cursor: pointer;
    }

    @media (max-width: 1064px) {
      .btn-container {
        align-self: flex-start;
      }
    }
  }

  .hidden {
    display: none;
  }
}
</style>
<template>
  <div ref="labelsList" class="label-info">
    <div v-if="activeAnnotationSet">
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
                annotationSelected &&
                annotation.id === annotationSelected.id &&
                'selected'
            ]"
            :ref="`annotation${annotation && annotation.id}`"
            v-for="annotation in annotationsInLabelSet(annotationSet)"
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
                  <span
                    v-if="annotation.offset_string"
                    class="label-property-value"
                    role="textbox"
                    contenteditable
                    @blur="event => handleBlur(event, annotation)"
                    @input="event => handleInput(event, annotation)"
                    @keypress.enter="event => event.preventDefault()"
                    @click="
                      annotation.label_description && onLabelClick(annotation)
                    "
                  >
                    {{ annotation.offset_string }}
                  </span>
                  <span v-else class="label-property-value">
                    {{ annotation.offset_string }}
                  </span>
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
            <div
              v-if="showWarning"
              :class="[
                'message',
                !notEditing && annotation.id !== annBeingEdited.id && 'hidden'
              ]"
            >
              <b-message
                class="is-warning warning-msg message-body-border-color message-body-padding"
              >
                <div class="message-container">
                  {{ warningMessage }}
                  <div @click="handleClose" class="btn-container">
                    <CloseBtnImg class="close-btn" />
                  </div>
                </div>
              </b-message>
            </div>
            <div
              v-if="showError"
              :class="[
                'message',
                !edited && annotation.id !== annBeingEdited.id && 'hidden'
              ]"
            >
              <b-message
                class="is-danger danger-msg message-body-border-color message-body-padding"
              >
                <div class="message-container">
                  {{ errorMessage }}
                  <div @click="handleClose" class="btn-container">
                    <CloseBtnImg class="close-btn" />
                  </div>
                </div>
              </b-message>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- When there's no annotations in the label -->
    <div v-if="!activeAnnotationSet || activeAnnotationSet.labels.length == 0">
      <EmptyState />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import EmptyState from "./EmptyState";
import CaretDown from "../../assets/CaretDownImg";
import CloseBtnImg from "../../assets/CloseBtnImg";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    CaretDown,
    CloseBtnImg
  },
  data() {
    return {
      labelOpen: null,
      annotationAnimationTimeout: null,
      oldValue: null,
      newValue: null,
      warningMessage: "AI can’t be trained if you change the text manually.",
      showWarning: false,
      notEditing: true,
      annBeingEdited: null,
      errorMessage: "Editing was not possible. Please try again later",
      showError: false,
      edited: false
    };
  },
  computed: {
    ...mapGetters("document", {
      annotationsInLabelSet: "annotationsInLabelSet"
    }),
    ...mapState("document", [
      "activeAnnotationSet",
      "annotationSelected",
      "focusedAnnotation"
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
      this.$store.dispatch("document/setFocusedAnnotation", {
        id: annotation && annotation.id ? annotation.id : null
      });
    },
    // Check if the user deleted or added text to the annotation
    isNewValueInOld(event, annotation) {
      this.oldValue = annotation.span[0].offset_string;
      this.newValue = event.target.textContent.trim();
      return this.oldValue.includes(this.newValue);
    },
    handleInput(event, annotation) {
      const newInOldValue = this.isNewValueInOld(event, annotation);
      this.annBeingEdited = annotation;
      this.notEditing = false;

      // If the user changes the input by adding to the existing annotation
      // we show a warning
      if (!newInOldValue || this.newValue.length === 0) {
        this.showWarning = true;
      }
    },
    handleBlur(event, annotation) {
      const spanArray = annotation.span[0];
      const id = annotation.id;

      // If the user didn't change the value, we don't want to do anything
      if (this.newValue === this.oldValue) {
        return;
      }
      // TODO: check what happens when the new value is empty since it defaults to the original one in the backend
      const updatedString = {
        span: [
          {
            offset_string: this.newValue,
            bottom: spanArray.bottom,
            top: spanArray.top,
            page_index: spanArray.page_index,
            x0: spanArray.x0,
            x1: spanArray.x1,
            y0: spanArray.y0,
            y1: spanArray.y1
          }
        ]
      };

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
            this.edited = false;
          }
        });
    },
    handleClose() {
      if (this.showWarning) {
        this.showWarning = false;
      } else if (this.showError) {
        this.showError = false;
      }
    }
  },
  watch: {
    activeAnnotationSet() {
      this.labelOpen = null;
    },
    annotationSelected() {
      // if an annotation is selected, scroll to it
      if (this.annotationSelected) {
        clearTimeout(this.annotationAnimationTimeout);
        setTimeout(() => {
          this.$refs.labelsList.scrollTo({
            top: this.$refs[`annotation${this.annotationSelected.id}`][0]
              .offsetTop,
            behavior: "smooth"
          });

          // remove annotation selection after some time
          this.annotationAnimationTimeout = setTimeout(() => {
            this.$store.dispatch("document/setAnnotationSelected", null);
          }, 1500);
        }, 100);
        // add a timeout in case we need to wait if a tab is going to be changed
      }
    }
  }
};
</script>
