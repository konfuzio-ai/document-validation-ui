<!-- eslint-disable vue/no-v-html -->
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
        'no-padding-top',
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
      :active="selectedSet && (!labels || labels.length === 0)"
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
        v-model="selectedLabel"
        aria-role="list"
        :disabled="!textFromEntities || !labels || labels.length === 0"
        scrollable
        class="label-dropdown annotation-dropdown dropdown-full-width"
      >
        <template #trigger>
          <b-button
            :class="[
              'popup-input',
              selectedLabel ? '' : 'not-selected',
              'has-right-icon',
            ]"
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

export default {
  props: {
    spans: {
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
      "numberOfLabelSetGroup",
      "labelsFilteredForAnnotationCreation",
    ]),
    ...mapState("display", ["showBranding"]),
    ...mapGetters("display", ["clientToBbox", "bboxToRect"]),
    ...mapState("selection", ["spanSelection", "selection"]),
    top() {
      if (this.selection && this.selection.end) {
        const top = this.selection.end.y + margin;
        //check if the popup will not go off the container on the top
        return top + heightOfPopup < this.containerHeight
          ? top
          : this.selection.end.y - heightOfPopup;
      } else {
        const normalizedSpan = this.bboxToRect(this.page, this.spans[0]);
        const top = normalizedSpan.y - heightOfPopup; // subtract the height of the popup plus some margin

        //check if the popup will not go off the container on the top
        return normalizedSpan.y > heightOfPopup
          ? top
          : normalizedSpan.y + normalizedSpan.height + margin;
      }
    },
    left() {
      if (this.selection && this.selection.start && this.selection.end) {
        const left = this.selection.start.x;
        //check if the popup will not go off the container on the right
        return left + widthOfPopup < this.containerWidth
          ? left
          : this.containerWidth - widthOfPopup;
      } else {
        const normalizedSpan = this.bboxToRect(this.page, this.spans[0]);
        const left =
          normalizedSpan.x + normalizedSpan.width / 2 - widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

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

      let text = "";
      this.spanSelection.forEach((span) => {
        text = `${text} ${span.offset_string}`;
      });

      return text.trim();
    },
  },
  watch: {
    selectedSet(newValue) {
      this.selectedLabel = null;
      this.labels = this.labelsFilteredForAnnotationCreation(newValue);
      if (this.labels.length === 1) {
        this.selectedLabel = this.labels[0];
      }
    },
  },
  mounted() {
    this.setsList = this.orderedSetList([...this.annotationSets]);
    if (this.setsList.length === 1) {
      this.selectedSet = this.setsList[0];
    }

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
    close() {
      this.$store.dispatch("selection/disableSelection");
      this.$emit("close");
    },
    save() {
      this.loading = true;
      const span = this.spans.flatMap((ann) => {
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
