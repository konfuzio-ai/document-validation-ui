<template>
  <section class="choose-label-set-modal">
    <b-modal
      ref="modal"
      v-model="show"
      :can-cancel="['x', 'outside']"
      class="modal-absolute modal-400 modal-no-footer"
      :on-cancel="close"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>
            {{
              isMultipleAnnotations
                ? $t("new_multi_ann_title")
                : $t("new_ann_set_title")
            }}
          </h3>
          <p>
            {{
              isMultipleAnnotations
                ? $t("new_multi_ann_description")
                : $t("new_ann_set_description")
            }}
          </p>
          <b-tooltip
            multilined
            :active="labelSets.length === 0"
            size="is-large"
            position="is-bottom"
            class="bottom-aligned"
            :close-delay="5000"
          >
            <template #content>
              <div ref="tooltipContent"></div>
            </template>
            <b-dropdown
              v-model="selectedLabelSet"
              aria-role="list"
              :disabled="labelSets.length === 0"
              :class="[
                'label-set-dropdown',
                labelSets.length === 0 && 'dropdown-disabled',
              ]"
            >
              <template #trigger>
                <div>
                  <div>
                    <span v-if="selectedLabelSet">{{
                      selectedLabelSet.name
                    }}</span>
                    <span v-else>{{ $t("select_label_set") }}</span>
                  </div>
                </div>
              </template>
              <b-dropdown-item
                v-for="labelSetItem in labelSets"
                :key="labelSetItem.id"
                aria-role="listitem"
                :value="labelSetItem"
                @click="setSelectedLabelSet(labelSetItem)"
              >
                <span>{{ labelSetItem.name }}</span>
              </b-dropdown-item>
            </b-dropdown>
          </b-tooltip>
          <div v-if="selectedLabelSet" class="labels-list">
            <div v-if="isMultipleAnnotations" class="labels-select">
              <div v-for="label in labels" :key="label.id">
                <b-checkbox v-model="label.selected">{{
                  label.name
                }}</b-checkbox>
              </div>
            </div>
            <span v-for="(label, index) in labels" v-else :key="label.id">{{
              `${label.name}${index + 1 !== labels.length ? ", " : ""}`
            }}</span>
          </div>
          <b-button
            class="submit-ann-set primary-button"
            type="is-primary"
            :disabled="!selectedLabelSet"
            @click="submit"
          >
            {{ $t("continue") }}
          </b-button>
          <p
            v-if="!isMultipleAnnotations && selectedLabelSet"
            class="next-step-description"
          >
            {{ $t("new_ann_set_hint") }}
          </p>
        </div>
      </section>
    </b-modal>
  </section>
</template>

<script>
/**
 * This component shows a modal to choose a label set from the project
 */

import { mapGetters, mapState } from "vuex";

export default {
  name: "CreateAnnotationSetModal",
  props: {
    isMultipleAnnotations: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  data() {
    return {
      selectedLabelSet: null,
      labelSets: [],
      show: true,
      labels: [],
    };
  },
  computed: {
    ...mapState("document", ["annotationSets"]),
    ...mapGetters("project", ["labelSetsFilteredForAnnotationSetCreation"]),
  },
  watch: {
    labelSets(newValue) {
      if (newValue.length === 0) {
        this.setTooltipText();
      }
    },
  },
  mounted() {
    this.$store.dispatch("project/fetchLabelSets").then((data) => {
      this.labelSets = this.labelSetsFilteredForAnnotationSetCreation(
        data,
        this.annotationSets
      );
    });
  },
  methods: {
    submit() {
      // filter labels that were selected (by default all are selected so no issue if the feature is disabled)
      const labelsFiltered = this.labels.filter((label) => label.selected);
      this.selectedLabelSet.labels = this.selectedLabelSet.labels.filter(
        (label) => {
          return labelsFiltered.find((filtered) => filtered.id === label.id);
        }
      );

      this.$emit("labelSet", this.selectedLabelSet);
      this.close();
    },
    setSelectedLabelSet(labelSet) {
      this.createLabelsList(labelSet.labels);
      this.selectedLabelSet = labelSet;
    },
    close() {
      this.$emit("close");
    },
    createLabelsList(labels) {
      this.labels = labels.map((label) => {
        return {
          ...label,
          selected: true,
        };
      });
    },
    setTooltipText() {
      // Text set from innerHTML vs 'label' due to html tag in locales file string
      this.$refs.tooltipContent.innerHTML = this.$t(
        "no_multi_ann_labelset_model"
      );
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/choose_label_set_modal.scss"
></style>
