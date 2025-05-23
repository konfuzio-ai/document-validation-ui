<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    v-if="annotation && !hide"
    class="annotation-popup small"
    :style="{ left: `${left}px`, top: `${top}px` }"
  >
    <b-dropdown
      v-model="selectedSet"
      aria-role="list"
      :class="[
        'annotation-dropdown',
        'no-padding-bottom',
        'dropdown-full-width',
        setsList.length === 0 ? 'no-padding-top' : '',
      ]"
      scrollable
    >
      <template #trigger>
        <b-button
          :class="[
            'popup-input',
            selectedSet ? '' : 'not-selected',
            'has-right-icon',
          ]"
          type="is-text"
        >
          {{
            selectedSet
              ? `${selectedSet.label_set.name} ${
                  selectedSet.id
                    ? numberOfAnnotationSetGroup(selectedSet)
                    : `${numberOfLabelSetGroup(selectedSet.label_set)} (${$t(
                        "new"
                      )})`
                }`
              : $t("select_annotation_set")
          }}
          <span class="caret-icon">
            <b-icon icon="angle-down" size="is-small" class="caret" />
          </span>
        </b-button>
      </template>
      <b-button
        type="is-ghost"
        :class="['add-ann-set', 'dropdown-item', 'no-icon-margin']"
        icon-left="plus"
        @click="openAnnotationSetCreation"
      >
        {{ $t("new_ann_set_title") }}
      </b-button>
      <b-dropdown-item
        v-for="(set, index) in setsList"
        :key="`${set.label_set.id}_${index}`"
        aria-role="listitem"
        :value="set"
      >
        <span>{{
          `${set.label_set.name} ${
            set.id
              ? numberOfAnnotationSetGroup(set)
              : `${numberOfLabelSetGroup(set.label_set)} (${$t("new")})`
          }`
        }}</span>
      </b-dropdown-item>
    </b-dropdown>
    <b-tooltip
      multilined
      :active="selectedSet && (!labelsFiltered || labelsFiltered.length === 0)"
      size="is-large"
      position="is-bottom"
      class="bottom-aligned"
      :close-delay="5000"
    >
      <template #content>
        <div
          v-html="
            `${$t('no_labels_available')} ${
              showBranding ? $t('no_labels_available_link') : ''
            }`
          "
        ></div>
      </template>
      <b-dropdown
        v-if="selectedLabel"
        v-model="selectedLabel"
        aria-role="list"
        :disabled="!labelsFiltered || labelsFiltered.length === 0"
        scrollable
        class="label-dropdown annotation-dropdown dropdown-full-width"
      >
        <template #trigger>
          <b-button
            class="popup-input has-right-icon"
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
        :label="$t('hide')"
        :disabled="loading"
        @click.prevent="hide = true"
      />
      <b-button
        type="is-primary"
        class="popup-button primary-button"
        :label="$t('save')"
        :disabled="loading || !spanSelection || !selectedLabel || !wasChanged"
        @click.prevent="save"
      />
    </div>
  </div>
</template>
<script>
/**
 * This component is used to show a popup
 * for editing an annotation.
 */
const heightOfPopup = 142;
const margin = 12;
const widthOfPopup = 205;

import { mapGetters, mapState } from "vuex";

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
      hide: false,
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
      "numberOfLabelSetGroup",
      "labelsFilteredForAnnotationCreation",
    ]),
    ...mapState("display", ["showBranding"]),
    ...mapGetters("display", ["bboxToRect"]),
    ...mapState("selection", ["selection", "spanSelection"]),
    top() {
      if (this.selection && this.selection.start && this.selection.end) {
        const top = this.selection.start.y - heightOfPopup; // subtract the height of the popup plus some margin

        const height = this.selection.end.y - this.selection.start.y;

        //check if the popup will not go off the container on the top
        return this.selection.start.y > heightOfPopup
          ? top - margin
          : this.selection.start.y + height + margin;
      }
      return 0;
    },
    left() {
      if (this.selection && this.selection.start && this.selection.end) {
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
      }
      return 0;
    },
    wasChanged() {
      return (
        this.editAnnotation.annotationSet.id !== this.selectedSet.id ||
        this.editAnnotation.label.id !== this.selectedLabel.id
      );
    },
  },
  watch: {
    selectedSet(newValue) {
      this.labelsFiltered = this.labelsFilteredForAnnotationCreation(newValue);
    },
    editAnnotation() {
      this.hide = false;
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
    orderedSetList(setsList) {
      setsList.sort((a, b) => {
        const nameA = a.label_set.name;
        const nameB = b.label_set.name;
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        // names must be equal
        return 0;
      });
      return setsList;
    },
    loadInfo() {
      this.setsList = this.orderedSetList([...this.annotationSets]);

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

      if (this.wasChanged) {
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

        this.$store
          .dispatch("document/createAnnotation", {
            annotation: annotationToCreate,
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
      // check if there's already a new entry for that label set to be created
      const existsIndex = this.setsList.findIndex((set) => {
        return set.id === null && set.label_set.id === labelSet.id;
      });

      const newSet = {
        label_set: labelSet,
        labels: labelSet.labels,
        id: null,
      };
      if (existsIndex >= 0) {
        this.setsList[existsIndex] = newSet;
      } else {
        this.setsList.unshift(newSet);
      }
      this.selectedSet = newSet;
    },
    openAnnotationSetCreation() {
      this.$store.dispatch("display/showChooseLabelSetModal", {
        show: true,
        finish: this.chooseLabelSet,
      });
    },
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/new_annotation.scss"></style>
