<style scoped lang="scss">
.label-info {
  font-family: "Inter", sans-serif;
  overflow: auto;
  flex: 1;
  padding: 0 16px;
  .label-title {
    font-weight: 600;
    font-size: 18px;
    color: var(--textColor);
    margin-top: 24px;
  }

  .label-description {
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: var(--secondaryTextColor);
  }

  .label-group {
    .label-group-name {
      margin-top: 24px;
      margin-bottom: 8px;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: var(--textColor);
    }
  }

  .label-properties {
    width: 100%;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
    border-bottom: 1px solid var(--bgColor);
    transition: background-color 0.2s ease-out;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--hoverColor);
    }
    &.selected {
      background-color: var(--lowOpacityPrimaryColor);
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
          color: var(--secondaryTextColor);
          margin-left: 4px;
          width: 100%;
          border-right: 4px solid var(--yellow);

          &.green {
            border-color: var(--green);
          }

          &.red {
            border-color: var(--red);
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
          color: var(--textColor);
          margin-left: 8px;
        }
      }
    }

    .label-property-description {
      padding: 0 20px;
      height: 0px;
      opacity: 0;
      color: var(--textColor);
      display: flex;
      align-items: center;
      background-color: var(--bgColor);
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
                  <span class="label-property-value">{{
                    annotation.offset_string
                  }}</span>
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
    ...mapGetters("sidebar", {
      annotationsInLabelSet: "annotationsInLabelSet"
    }),
    ...mapState("sidebar", ["activeAnnotationSet", "annotationSelected"]),
    ...mapState("document", ["focusedAnnotation"])
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
            this.$store.dispatch("sidebar/setAnnotationSelected", null);
          }, 1500);
        }, 100);
        // add a timeout in case we need to wait if a tab is going to be changed
      }
    }
  }
};
</script>
