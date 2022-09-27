<style scoped lang="scss" src="../../assets/scss/new_annotation.scss"></style>
<template>
  <div class="annotation-popup" :style="{ left: `${left}px`, top: `${top}px` }">
    <input class="popup-input" type="text" :value="content" />
    <b-dropdown v-model="selectedLabel" aria-role="list">
      <template #trigger>
        <b-button
          :class="['popup-input', selectedLabel ? '' : 'not-selected']"
          type="is-text"
        >
          {{ selectedLabel ? selectedLabel.name : $t("select_label") }}
          <span class="caret-icon"><CaretDownWhite /></span
        ></b-button>
      </template>
      <b-dropdown-item
        aria-role="listitem"
        v-for="label in labels"
        :key="label.id"
        :value="label"
      >
        <span>{{ label.name }}</span>
      </b-dropdown-item>
    </b-dropdown>
    <div class="annotation-buttons">
      <b-button
        type="is-text"
        class="cancel-button popup-button"
        :label="$t('cancel')"
        @click.prevent="close"
      />
      <b-button
        type="is-primary"
        class="popup-button"
        :label="$t('save')"
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
const heightOfPopup = 160;
const margin = 12;
const widthOfPopup = 205;

import { mapState } from "vuex";
import CaretDownWhite from "../../assets/images/CaretDownWhiteImg";

export default {
  components: {
    CaretDownWhite
  },
  props: {
    content: {
      type: String,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    x: {
      type: Number,
      required: true
    },
    entityWidth: {
      type: Number,
      required: true
    },
    entityHeight: {
      type: Number,
      required: true
    },
    containerWidth: {
      type: Number,
      required: true
    },
    containerHeight: {
      type: Number,
      required: true
    }
  },
  computed: {
    ...mapState("document", ["labels"]),
    top() {
      const top = this.y - heightOfPopup; // subtract the height of the popup plus some margin

      //check if the popup will not go off the container on the top
      return this.y > heightOfPopup ? top : this.y + this.entityHeight + margin;
    },
    left() {
      const left = this.x + this.entityWidth / 2 - widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

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
  data() {
    return {
      selectedLabel: null
    };
  },
  methods: {
    close() {
      console.log(this.labels);
      this.$emit("close");
    },
    save() {
      alert("save");
    }
  }
};
</script>
