<template>
  <div class="annotation-popup" :style="{ left: `${left}px`, top: `${top}px` }">
    <span class="popup-input">{{ annotation.offset_string }}</span>
    <b-dropdown
      v-model="selectedSet"
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
        :disabled="!labels || labels.length === 0"
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
    editAnnotation: {
      required: true,
      type: Object,
    },
    page: {
      required: true,
      type: Object,
    },
    containerWidth: {
      type: Number,
      required: true,
    },
    containerHeight: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      annotation: null,
      selectedLabel: null,
      selectedSet: null,
      labels: null,
      loading: false,
      isAnnSetModalShowing: false,
      setsList: [],
    };
  },
  computed: {
    ...mapState("document", ["annotationSets", "annotations"]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "labelsFilteredForAnnotationCreation",
    ]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapState("selection", ["spanSelection"]),
    top() {
      const bbox = this.bboxToRect(this.page, this.spanSelection);
      const top = bbox.y - heightOfPopup; // subtract the height of the popup plus some margin

      //check if the popup will not go off the container on the top
      return bbox.y > heightOfPopup ? top : bbox.y + bbox.height + margin;
    },
    left() {
      const bbox = this.bboxToRect(this.page, this.spanSelection);
      const left = bbox.x + bbox.width / 2 - widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

      //check if the popup will not go off the container
      if (left + widthOfPopup > this.containerWidth) {
        // on the right side
        return this.containerWidth - widthOfPopup;
      } else {
        // on the left side
        return left > 0 ? left : 0;
      }
    },
  },
  watch: {
    selectedSet(newValue) {
      this.selectedLabel = null;
      this.labels = this.labelsFilteredForAnnotationCreation(newValue);
    },
  },
  mounted() {
    console.log("span", this.annotationBox);
    console.log("span", this.spanSelection);
    console.log("editAnnotation", this.editAnnotation);
    this.setsList = [...this.annotationSets];

    this.selectedSet = this.annotationSets.find(
      (annSet) => annSet.id === this.editAnnotation.annotationSet
    );

    this.labels = this.labelsFilteredForAnnotationCreation(this.selectedSet);
    this.selectedLabel = this.labels.find(
      (label) => label.id === this.editAnnotation.label
    );

    this.annotation = this.annotations.find(
      (ann) => ann.id === this.editAnnotation.id
    );
    console.log("ann", this.annotation);

    console.log("selected set", this.selectedSet);
    console.log("selectedLabel", this.selectedLabel);
    console.log("labels", this.labels);

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
      // this.$store.dispatch("selection/setSelectedEntities", null);
      this.$emit("close");
    },
    save() {
      this.loading = true;
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
