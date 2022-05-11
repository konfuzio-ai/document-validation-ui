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
            v-for="(annotation, index) in annotationsInLabelSet(annotationSet)"
            v-bind:key="index"
            @mouseenter="onLabelHover(annotation)"
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
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    CaretDown
  },
  data() {
    return {
      labelOpen: null,
      annotationAnimationTimeout: null
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
    handleBlur(event, annotation) {
      const span = annotation.span[0];
      const id = annotation.id;
      const oldValue = span.offset_string;
      const newValue = event.target.textContent.trim();
      const newValueIsInOldValue = oldValue.includes(newValue);
      const bottom = span.bottom;
      const top = span.top;
      const pageIndex = span.page_index;
      const x0 = span.x0;
      const x1 = span.x1;
      const y0 = span.y0;
      const y1 = span.y1;

      // If the user didn't change the value, we don't want to do anything
      if (newValue === oldValue) {
        return;
      } else if (newValue.length === 0 || !newValueIsInOldValue) {
        // Show warning to the user
        console.log("AI cannot be trained!");
        // TODO: check what happens when the new value is empty since it defaults to the original one in the backend
      }

      const updatedString = {
        span: [
          {
            offset_string: newValue,
            bottom: bottom,
            top: top,
            page_index: pageIndex,
            x0: x0,
            x1: x1,
            y0: y0,
            y1: y1
          }
        ]
      };
      console.log(updatedString);
      // TODO: update in store:
      // this.$store.dispatch("document/updateAnnotation", {annotationId: id, updatedString: updatedString})
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
