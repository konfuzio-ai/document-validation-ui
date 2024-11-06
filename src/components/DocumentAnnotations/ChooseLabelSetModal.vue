<!-- eslint-disable vue/no-v-html -->
<template>
  <section class="choose-label-set-modal">
    <b-modal
      ref="modal"
      v-model="show"
      :can-cancel="['x', 'outside']"
      class="modal-absolute modal-400 modal-no-footer model-overflow-visible"
      :on-cancel="close"
    >
      <section class="modal-card-body">
        <div class="content">
          <h3>
            {{ $t("new_ann_set_title") }}
          </h3>
          <div>
            <div v-if="labelSetsFilteredForAnnotationSetCreation.length === 0">
              <p v-html="$t('no_multi_ann_labelset_model')" />
            </div>
            <div v-else>
              <p>
                {{ $t("new_ann_set_description") }}
              </p>

              <div class="label-set-list">
                <div
                  v-for="labelSetItem in labelSetsFilteredForAnnotationSetCreation"
                  :key="labelSetItem.id"
                  class="label-set-list-row"
                >
                  <b-button
                    class="full-width"
                    type="is-secondary"
                    @click="submit(labelSetItem)"
                  >
                    {{
                      `${labelSetItem.name} ${numberOfLabelSetGroup(
                        labelSetItem
                      )}`
                    }}
                  </b-button>
                  <div class="labels-list">
                    <span
                      v-for="(label, index) in labelSetItem.labels"
                      :key="label.id"
                      >{{
                        `${label.name}${
                          index + 1 !== labelSetItem.labels.length ? ", " : ""
                        }`
                      }}</span
                    >
                  </div>
                </div>
              </div>
              <p class="next-step-description">
                {{ $t("new_ann_set_hint") }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </b-modal>
  </section>
</template>

<script>
/**
 * This component shows a modal to choose a label set from the project
 */

import { mapGetters } from "vuex";

export default {
  name: "CreateAnnotationSetModal",
  data() {
    return {
      show: true,
      labels: [],
    };
  },
  computed: {
    ...mapGetters("document", [
      "numberOfLabelSetGroup",
      "labelSetsFilteredForAnnotationSetCreation",
    ]),
  },
  methods: {
    submit(labelSet) {
      this.$emit("finish", labelSet);
      this.close();
    },
    close() {
      this.$store.dispatch("display/showChooseLabelSetModal", null);
      this.$emit("close");
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/choose_label_set_modal.scss"
></style>
