<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="annotation-popup"
    :style="{
      left: `${left}px`,
      top: `${top}px`,
      height: `${heightOfPopup}px`,
    }"
  >
    <div v-if="!editAnnotation">
      <div v-if="spanLoading" class="popup-input">
        <b-icon icon="spinner" class="fa-spin loading-icon-size spinner" />
      </div>
      <input
        v-else
        v-model="textFromEntities"
        class="popup-input"
        type="text"
        :disabled="true"
      />
    </div>
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
          <span class="input-text">
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
            }}</span
          >
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
            <span class="input-text">{{
              selectedLabel
                ? selectedLabel.name
                : labels && labels.length === 0
                ? $t("no_labels_to_choose")
                : $t("select_label")
            }}</span>
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
      heightOfPopup: 192,
      margin: 12,
      widthOfPopup: 205,
      selectedLabel: null,
      selectedSet: null,
      labels: null,
      loading: false,
      isAnnSetModalShowing: false,
      setsList: [],
    };
  },
  computed: {
    ...mapState("document", ["annotationSets", "documentId", "editAnnotation"]),
    ...mapGetters("document", [
      "numberOfAnnotationSetGroup",
      "numberOfLabelSetGroup",
      "labelsFilteredForAnnotationCreation",
    ]),
    ...mapState("display", ["showBranding"]),
    ...mapGetters("display", ["clientToBbox", "bboxToRect"]),
    ...mapState("selection", ["spanSelection", "selection", "spanLoading"]),
    top() {
      if (this.selection && this.selection.end) {
        const top = this.selection.end.y + this.margin;
        //check if the popup will not go off the container on the top
        return top + this.heightOfPopup < this.containerHeight
          ? top
          : this.selection.end.y - this.heightOfPopup;
      } else {
        const normalizedSpan = this.bboxToRect(this.page, this.spans[0]);
        const top = normalizedSpan.y - this.heightOfPopup; // subtract the height of the popup plus some margin

        //check if the popup will not go off the container on the top
        return normalizedSpan.y > this.heightOfPopup
          ? top
          : normalizedSpan.y + normalizedSpan.height + this.margin;
      }
    },
    left() {
      if (this.selection && this.selection.start && this.selection.end) {
        const left = this.selection.start.x;
        //check if the popup will not go off the container on the right
        return left + this.widthOfPopup < this.containerWidth
          ? left
          : this.containerWidth - this.widthOfPopup;
      } else {
        const normalizedSpan = this.bboxToRect(this.page, this.spans[0]);
        const left =
          normalizedSpan.x + normalizedSpan.width / 2 - this.widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

        //check if the popup will not go off the container
        if (left + this.widthOfPopup > this.containerWidth) {
          // on the right side
          return this.containerWidth - this.widthOfPopup;
        } else {
          // on the left side
          return left > 0 ? left : 0;
        }
      }
    },
    textFromEntities() {
      let text = "";
      this.spans.forEach((span) => {
        text = `${text} ${span.offset_string}`;
      });

      return text.trim();
    },
  },
  watch: {
    selectedSet(newValue, oldValue) {
      this.selectedLabel = null;
      this.labels = this.labelsFilteredForAnnotationCreation(newValue);
      if (oldValue === null && this.editAnnotation) {
        this.selectedLabel = this.editAnnotation.label;
      } else if (this.labels.length === 1) {
        this.selectedLabel = this.labels[0];
      }
    },
  },
  mounted() {
    this.setsList = this.orderedSetList([...this.annotationSets]);

    if (this.editAnnotation) {
      this.heightOfPopup = 142;
      this.selectedSet = this.editAnnotation.annotationSet;
    } else if (this.setsList.length === 1) {
      this.selectedSet = this.setsList[0];
    }

    setTimeout(() => {
      // prevent click propagation when opening the popup
      document.body.addEventListener("click", this.clickOutside);
    }, 200);
  },
  unmounted() {
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
      if (this.editAnnotation) {
        this.$store.dispatch("document/resetEditAnnotation");
      }
      this.$store.dispatch("selection/disableSelection");
      this.$emit("close");
    },
    save() {
      if (this.editAnnotation) {
        this.loading = true;
        this.$store.dispatch("document/setEditAnnotation", {
          id: this.editAnnotation.id,
          index: this.editAnnotation.index,
          label: this.selectedLabel,
          labelSet: this.selectedSet.label_set,
          annotationSet: this.selectedSet,
          pageNumber: this.editAnnotation.pageNumber,
        });

        document.getElementById("save-ann").click();

        return;
      } else {
        this.loading = true;

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
          span: this.spans,
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
