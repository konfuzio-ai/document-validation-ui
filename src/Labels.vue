<template>
  <div>
    <div class="label-info" v-if="activeAnnotationSet">
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
            :id="annotation && annotation.id"
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
    <div
      v-if="!activeAnnotationSet || activeAnnotationSet.labels.length == 0"
      class="empty-annotations"
    >
      <EmptyStateImg />
      <div class="empty-text">
        <p class="title">No labels found</p>
        <p class="description">There are no labels in this label set.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import EmptyStateImg from "./assets/EmptyStateImg";
import CaretDown from "./assets/CaretDownImg";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyStateImg,
    CaretDown
  },
  data() {
    return {
      labelOpen: null
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
      // (add a timeout for waiting if a tab is going to be changed)
      if (this.annotationSelected) {
        setTimeout(() => {
          document
            .getElementById(`${this.annotationSelected.id}`)
            .scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          // remove annotation selected after some time
          setTimeout(() => {
            this.$store.dispatch("sidebar/setAnnotationSelected", null);
          }, 1500);
        }, 100);
      }
    }
  }
};
</script>
