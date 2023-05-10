<template>
  <div class="annotation-popup" :style="{ left: `${left}px`, top: `${top}px` }">
    <input v-model="textFromEntities" class="popup-input" type="text" />
    <b-dropdown
      v-model="selectedSet"
      aria-role="list"
      :class="[
        'no-padding-bottom',
        setsList.length === 0 ? 'no-padding-top' : '',
      ]"
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
        class="label-dropdown"
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
        :disabled="loading || !getTextFromEntities || !selectedLabel"
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
import { ChooseLabelSetModal } from "../DocumentAnnotations";

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
      "getTextFromEntities",
    ]),
    top() {
      const top = this.newAnnotation[0].entity.scaled.y - heightOfPopup; // subtract the height of the popup plus some margin

      //check if the popup will not go off the container on the top
      return this.newAnnotation[0].entity.scaled.y > heightOfPopup
        ? top
        : this.newAnnotation[0].entity.scaled.y +
            this.newAnnotation[0].entity.scaled.height +
            margin;
    },
    left() {
      const left =
        this.newAnnotation[0].entity.scaled.x +
        this.newAnnotation[0].entity.scaled.width / 2 -
        widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

      //check if the popup will not go off the container
      if (left + widthOfPopup > this.containerWidth) {
        // on the right side
        return this.containerWidth - widthOfPopup;
      } else {
        // on the left side
        return left > 0 ? left : 0;
      }
    },
    textFromEntities() {
      return this.getTextFromEntities();
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
      this.$store.dispatch("document/setSelectedEntities", null);
      this.$emit("close");
    },
    save() {
      this.loading = true;
      const span = this.newAnnotation.flatMap((ann) => {
        return { ...ann.entity.original, offset_string: ann.content };
      });

      const annotationToCreate = {
        document: this.documentId,
        span: span,
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
        .dispatch("document/createAnnotation", annotationToCreate)
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
    disableLabelSetModalShowing() {
      // timeout to stop propagation of click event
      setTimeout(() => {
        this.isAnnSetModalShowing = false;
      }, 500);
    },
    chooseLabelSet(labelSet) {
      this.disableLabelSetModalShowing();

      const newSet = {
        label_set: labelSet,
        labels: labelSet.labels,
        id: null,
      };
      this.setsList.push(newSet);
      this.selectedSet = newSet;
    },
    openAnnotationSetCreation() {
      this.isAnnSetModalShowing = true;

      this.$buefy.modal.open({
        parent: this.$parent,
        component: ChooseLabelSetModal,
        hasModalCard: true,
        trapFocus: true,
        canCancel: false,
        onCancel: this.disableLabelSetModalShowing,
        customClass: "dv-ui-theme invisible-parent-modal",
        events: {
          labelSet: this.chooseLabelSet,
          close: this.disableLabelSetModalShowing,
        },
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
