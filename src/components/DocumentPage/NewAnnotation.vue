<template>
  <div class="annotation-popup" :style="{ left: `${left}px`, top: `${top}px` }">
    <div v-if="!textFromEntities" class="popup-input">
      <b-icon icon="spinner" class="fa-spin loading-icon-size spinner" />
    </div>
    <input v-else v-model="textFromEntities" class="popup-input" type="text" />
    <b-dropdown
      v-model="selectedSet"
      :disabled="!textFromEntities"
      aria-role="list"
      :class="[
        'annotation-dropdown',
        'no-padding-bottom',
        setsList.length === 0 ? 'no-padding-top' : '',
      ]"
      scrollable
    >
      <template #trigger>
        <b-button
          :class="['popup-input', selectedSet ? '' : 'not-selected']"
          type="is-text"
        >
          {{
            selectedSet
              ? `${selectedSet.label_set.name} ${
                  selectedSet.id
                    ? numberOfAnnotationSetGroup(selectedSet)
                    : `(${$t("new")})`
                }`
              : $t("select_annotation_set")
          }}
          <span class="caret-icon">
            <b-icon icon="angle-down" size="is-small" class="caret" />
          </span>
        </b-button>
      </template>
      <b-dropdown-item
        v-for="(set, index) in setsList"
        :key="`${set.label_set.id}_${index}`"
        aria-role="listitem"
        :value="set"
      >
        <span>{{
          `${set.label_set.name} ${
            set.id ? numberOfAnnotationSetGroup(set) : `(${$t("new")})`
          }`
        }}</span>
      </b-dropdown-item>
      <b-button
        type="is-ghost"
        :class="[
          'add-ann-set',
          'dropdown-item',
          'no-icon-margin',
          setsList.length > 0 ? 'has-border' : '',
        ]"
        icon-left="plus"
        @click="openAnnotationSetCreation"
      >
        {{ $t("new_ann_set_title") }}
      </b-button>
    </b-dropdown>
    <b-tooltip
      multilined
      :active="selectedSet && (!labels || labels.length === 0)"
      size="is-large"
      position="is-bottom"
      class="bottom-aligned"
      :close-delay="5000"
    >
      <template #content>
        <div ref="tooltipContent"></div>
      </template>
      <b-dropdown
        v-model="selectedLabel"
        aria-role="list"
        :disabled="!textFromEntities || !labels || labels.length === 0"
        scrollable
        class="label-dropdown annotation-dropdown"
      >
        <template #trigger>
          <b-button
            :class="['popup-input', selectedLabel ? '' : 'not-selected']"
            type="is-text"
          >
            {{
              selectedLabel
                ? selectedLabel.name
                : labels && labels.length === 0
                ? $t("no_labels_to_choose")
                : $t("select_label")
            }}
            <span class="caret-icon">
              <b-icon icon="angle-down" size="is-small" class="caret" />
            </span>
          </b-button>
        </template>
        <b-dropdown-item
          v-for="label in labels"
          :key="label.id"
          aria-role="listitem"
          :value="label"
        >
          <span>{{ label.name }}</span>
        </b-dropdown-item>
      </b-dropdown>
    </b-tooltip>
    <div class="annotation-buttons">
      <b-button
        type="is-text"
        class="cancel-button popup-button primary-button"
        :label="$t('cancel')"
        :disabled="loading"
        @click.prevent="close"
      />
      <b-button
        type="is-primary"
        class="popup-button primary-button"
        :label="$t('save')"
        :disabled="loading || !spanSelection || !selectedLabel"
        @click.prevent="save"
      />
    </div>
  </div>
</template>
<script>
/**
 * This component is used to show a popup
 * for creating a new annotation.
 */
const heightOfPopup = 192;
const margin = 12;
const widthOfPopup = 205;

import { mapGetters, mapState } from "vuex";
import { MULTI_ANN_TABLE_FEATURE } from "../../constants";

export default {
  props: {
    newAnnotation: {
      required: true,
      type: Array,
    },
    containerWidth: {
      type: Number,
      required: true,
    },
    containerHeight: {
      type: Number,
      required: true,
    },
    page: {
      required: true,
      type: Object,
    },
  },
  data() {
    return {
      selectedLabel: null,
      selectedSet: null,
      labels: null,
      loading: false,
      isAnnSetModalShowing: false,
      setsList: [],
    };
  },
  computed: {
    ...mapState("document", ["annotationSets", "documentId"]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "labelsFilteredForAnnotationCreation",
      "isNegative",
    ]),
    ...mapGetters("display", ["clientToBbox"]),
    ...mapState("selection", ["spanSelection", "selection"]),
    top() {
      if (this.selection && this.selection.end) {
        const top = this.selection.end.y + margin;
        //check if the popup will not go off the container on the top
        return top + heightOfPopup < this.containerHeight
          ? top
          : this.selection.end.y - heightOfPopup;
      } else {
        const top = this.newAnnotation[0].scaled.y - heightOfPopup; // subtract the height of the popup plus some margin

        //check if the popup will not go off the container on the top
        return this.newAnnotation[0].scaled.y > heightOfPopup
          ? top
          : this.newAnnotation[0].scaled.y +
              this.newAnnotation[0].scaled.height +
              margin;
      }
    },
    left() {
      if (this.selection && this.selection.start && this.selection.end) {
        const left = this.selection.start.x;
        //check if the popup will not go off the container on the right
        return left + widthOfPopup < this.containerWidth
          ? left
          : this.containerWidth - widthOfPopup;
        return this.selection.start.x;
      } else {
        const left =
          this.newAnnotation[0].scaled.x +
          this.newAnnotation[0].scaled.width / 2 -
          widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

        //check if the popup will not go off the container
        if (left + widthOfPopup > this.containerWidth) {
          // on the right side
          return this.containerWidth - widthOfPopup;
        } else {
          // on the left side
          return left > 0 ? left : 0;
        }
      }
    },
    textFromEntities() {
      if (!this.spanSelection) return;

      // get array of all offset strings
      let text = this.spanSelection.map((span) => {
        return span.offset_string;
      });

      // join all the strings to become a single string of text
      return text.join().split(",").join(" ");
    },
  },
  watch: {
    selectedSet(newValue) {
      this.selectedLabel = null;
      this.labels = this.labelsFilteredForAnnotationCreation(newValue);
    },
  },
  mounted() {
    this.setsList = [...this.annotationSets];
    if (this.setsList.length === 1) {
      this.selectedSet = this.setsList[0];
    }

    setTimeout(() => {
      // prevent click propagation when opening the popup
      document.body.addEventListener("click", this.clickOutside);
    }, 200);

    this.setTooltipText();
  },
  destroyed() {
    document.body.removeEventListener("click", this.clickOutside);
  },
  methods: {
    close() {
      this.$store.dispatch("selection/setSelectedEntities", null);
      this.$store.dispatch("selection/endSelection");
      this.$emit("close");
    },
    save() {
      this.loading = true;
      const span = this.newAnnotation.flatMap((ann) => {
        return {
          ...ann.original,
          offset_string: ann.original.offset_string,
        };
      });

      let selection_bbox = null;

      if (this.selection && this.selection.start && this.selection.end) {
        selection_bbox = this.clientToBbox(
          this.page,
          this.selection.start,
          this.selection.end
        );
      }

      const annotationToCreate = {
        document: this.documentId,
        span: span,
        label: this.selectedLabel.id,
        is_correct: true,
        revised: false,
      };

      if (selection_bbox) {
        annotationToCreate.selection_bbox = selection_bbox;
      }

      if (this.selectedSet.id) {
        annotationToCreate.annotation_set = this.selectedSet.id;
      } else {
        annotationToCreate.label_set = this.selectedSet.label_set.id;
      }

      // check if the selected label already has a negative annotation
      let negativeAnnotationId;

      if (
        this.selectedLabel.annotations &&
        this.selectedLabel.annotations.length > 0
      ) {
        const negativeAnnotation = this.selectedLabel.annotations.find(
          (annotation) => this.isNegative(annotation)
        );

        if (negativeAnnotation) {
          negativeAnnotationId = negativeAnnotation.id;
        }
      }

      this.$store
        .dispatch("document/createAnnotation", {
          annotation: annotationToCreate,
          negativeAnnotationId: negativeAnnotationId,
        })
        .catch((error) => {
          this.$store.dispatch("document/createErrorMessage", {
            error,
            serverErrorMessage: this.$t("server_error"),
            defaultErrorMessage: this.$t("error_creating_annotation"),
          });
        })
        .finally(() => {
          this.close();
          this.loading = false;
        });
    },
    chooseLabelSet(labelSet) {
      const newSet = {
        label_set: labelSet,
        labels: labelSet.labels,
        id: null,
      };
      this.setsList.push(newSet);
      this.selectedSet = newSet;
    },
    openAnnotationSetCreation() {
      this.$store.dispatch("display/showChooseLabelSetModal", {
        show: true,
        isMultipleAnnotations: MULTI_ANN_TABLE_FEATURE,
        finish: this.chooseLabelSet,
      });
    },
    setTooltipText() {
      // Text set from innerHTML vs 'label' due to html tag in locales file string
      this.$refs.tooltipContent.innerHTML = this.$t("no_labels_available");
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/new_annotation.scss"></style>
