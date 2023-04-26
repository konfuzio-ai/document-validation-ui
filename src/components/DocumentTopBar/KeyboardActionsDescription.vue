<template>
  <div
    v-if="!publicView && !selectedDocument.is_reviewed && !editMode"
    class="keyboard-actions-description"
  >
    <section class="b-tooltips">
      <b-tooltip position="is-left" size="is-large" class="left-down-aligned">
        <KeyboardIcon />

        <template #content>
          <div class="tooltip-title">
            {{ $t("use_your_keyboard") }}
          </div>

          <div class="tooltip-description">
            <div class="content-line">
              <div class="action-item">
                <div class="key"><ArrowUpKey /></div>
                <div class="key"><ArrowDownKey /></div>
                <div class="keyboard-action-text">{{ $t("arrow_keys") }}</div>
              </div>

              <div class="tooltip-divider"></div>

              <div class="action-item">
                <div class="key">{{ "ESC" }}</div>
                <div class="keyboard-action-text">{{ $t("esc_key") }}</div>
              </div>
            </div>

            <div class="content-line">
              <div class="action-item">
                <div class="key">{{ "ENTER" }}</div>
                <div class="keyboard-action-text">{{ $t("enter_key") }}</div>
              </div>

              <div class="tooltip-divider"></div>

              <div class="action-item">
                <div class="key">{{ "DELETE" }}</div>
                <div class="keyboard-action-text">
                  {{ $t("missing_annotation") }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </b-tooltip>
    </section>
  </div>
</template>

<script>
import { mapState } from "vuex";
import KeyboardIcon from "../../assets/images/KeyboardIcon";
import ArrowUpKey from "../../assets/images/ArrowUpKey";
import ArrowDownKey from "../../assets/images/ArrowDownKey";

export default {
  name: "KeyboardActionsDescription",
  components: {
    KeyboardIcon,
    ArrowUpKey,
    ArrowDownKey,
  },
  computed: {
    ...mapState("edit", ["editMode"]),
    ...mapState("document", ["selectedDocument", "publicView"]),
  },
};
</script>

<style scoped lang="scss" src="../../assets/scss/document_top_bar.scss"></style>
