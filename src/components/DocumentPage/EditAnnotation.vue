<template>
  <div
    v-if="annotation"
    class="annotation-popup small"
    :style="{ left: `${left}px`, top: `${top}px` }"
  >
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
      :active="selectedSet && (!labelsFiltered || labelsFiltered.length === 0)"
      size="is-large"
      position="is-bottom"
      class="bottom-aligned"
      :close-delay="5000"
    >
      <b-dropdown
        v-if="selectedLabel"
        v-model="selectedLabel"
        aria-role="list"
        :disabled="!labelsFiltered || labelsFiltered.length === 0"
        scrollable
        class="label-dropdown annotation-dropdown"
      >
        <template #trigger>
          <b-button
            class="popup-input"
            :disabled="!labelsFiltered"
            type="is-text"
          >
            {{ selectedLabel.name }}
            <span class="caret-icon">
              <b-icon icon="angle-down" size="is-small" class="caret" />
            </span>
          </b-button>
        </template>
        <b-dropdown-item
          v-for="label in labelsFiltered"
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
const heightOfPopup = 142;
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
      labelsFiltered: null,
      loading: false,
      isAnnSetModalShowing: false,
      setsList: [],
    };
  },
  computed: {
    ...mapState("document", [
      "annotationSets",
      "annotations",
      "labels",
      "documentId",
    ]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "labelsFilteredForAnnotationCreation",
      "isNegative",
    ]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapState("selection", ["selection", "spanSelection"]),
    top() {
      const top = this.selection.start.y - heightOfPopup; // subtract the height of the popup plus some margin

      const height = this.selection.end.y - this.selection.start.y;

      //check if the popup will not go off the container on the top
      return this.selection.start.y > heightOfPopup
        ? top
        : this.selection.start.y + height + margin;
    },
    left() {
      const width = this.selection.end.x - this.selection.start.x;

      const left = this.selection.start.x + width / 2 - widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

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
      this.labelsFiltered = this.labelsFilteredForAnnotationCreation(newValue);
    },
    editAnnotation() {
      this.loadInfo();
    },
  },
  mounted() {
    this.loadInfo();

    setTimeout(() => {
      // prevent click propagation when opening the popup
      document.body.addEventListener("click", this.clickOutside);
    }, 200);
  },
  destroyed() {
    document.body.removeEventListener("click", this.clickOutside);
  },
  methods: {
    loadInfo() {
      this.setsList = [...this.annotationSets];

      this.selectedSet = this.annotationSets.find(
        (annSet) => annSet.id === this.editAnnotation.annotationSet.id
      );

      this.labelsFiltered = this.labelsFilteredForAnnotationCreation(
        this.selectedSet
      );

      // if existing label is not able to be chosen we add it manually
      if (!this.labelsFiltered.includes(this.editAnnotation.label)) {
        this.labelsFiltered.push(this.editAnnotation.label);
      }

      this.selectedLabel = this.editAnnotation.label;

      this.annotation = this.annotations.find(
        (ann) => ann.id === this.editAnnotation.id
      );
    },
    close() {
      this.$store.dispatch("document/resetEditAnnotation");
      this.$store.dispatch("selection/disableSelection");
      this.$store.dispatch("selection/setSelectedEntities", null);
      this.$emit("close");
    },
    async save() {
      this.loading = true;

      if (
        this.editAnnotation.labelSet.id !== this.selectedSet.id ||
        this.editAnnotation.label.id !== this.selectedLabel.id
      ) {
        // first delete annotation, then create new one
        await this.$store
          .dispatch("document/deleteAnnotation", {
            annotationId: this.annotation.id,
          })
          .catch((error) => {
            this.$store.dispatch("document/createErrorMessage", {
              error,
              serverErrorMessage: this.$t("server_error"),
              defaultErrorMessage: this.$t("edit_error"),
            });
          });

        const spans = this.annotation.span;
        spans[this.editAnnotation.index] = this.spanSelection;

        const annotationToCreate = {
          document: this.documentId,
          span: spans,
          label: this.selectedLabel.id,
          is_correct: true,
          revised: false,
        };

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
      } else {
        this.close();
      }
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
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/new_annotation.scss"></style>
