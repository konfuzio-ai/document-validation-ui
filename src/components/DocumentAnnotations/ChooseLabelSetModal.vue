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
          <h3>{{ $t("new_ann_set_title") }}</h3>
          <p>{{ $t("new_ann_set_description") }}</p>
          <b-dropdown
            v-model="selectedLabelSet"
            aria-role="list"
            :disabled="labelSets.length === 0"
            class="label-set-dropdown"
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
          <div
            v-if="selectedLabelSet"
            class="labels-list"
          >
            <span
              v-for="(label, index) in selectedLabelSet.labels"
              :key="label.id"
            >{{
              `${label.name}${
                index + 1 !== selectedLabelSet.labels.length ? ", " : ""
              }`
            }}</span>
          </div>
          <b-button
            class="submit-ann-set"
            type="is-primary"
            :disabled="!selectedLabelSet"
            @click="submit"
          >
            {{ $t("continue") }}
          </b-button>
          <p
            v-if="selectedLabelSet"
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
  computed: {
    ...mapState("document", ["annotationSets"]),
    ...mapGetters("project", ["labelSetsFilteredForAnnotationSetCreation"])
  },
  data() {
    return {
      selectedLabelSet: null,
      labelSets: [],
      show: true
    };
  },
  mounted() {
    this.$store.dispatch("project/fetchLabelSets").then(data => {
      this.labelSets = this.labelSetsFilteredForAnnotationSetCreation(
        data,
        this.annotationSets
      );
    });
  },
  methods: {
    submit() {
      this.$emit("labelSet", this.selectedLabelSet);
      this.close();
    },
    setSelectedLabelSet(labelSet) {
      this.selectedLabelSet = labelSet;
    },
    close() {
      this.$emit("close");
    }
  }
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/choose_label_set_modal.scss"
></style>
