<style scoped lang="scss" src="../../assets/scss/new_annotation.scss"></style>
<template>
  <div class="annotation-popup" :style="{ left: `${left}px`, top: `${top}px` }">
    <input class="annotation-value" type="text" :value="content" />
    <b-dropdown aria-role="list">
      <b-dropdown-item v-model="selectedLabel">
        <span>Selected</span>
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
const halfWidthOfPopup = 102;
export default {
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
    }
  },
  computed: {
    top() {
      const top = this.y - heightOfPopup; // subtract the height of the popup plus some margin

      //check if the popup will not go off the container
      return this.y > heightOfPopup ? top : this.y + this.entityHeight + margin;
    },
    left() {
      const left = this.x + this.entityWidth / 2 - halfWidthOfPopup; // add the entity half width to be centered and then subtract half the width of the popup

      //check if the popup will not go off the container
      return left > 0 ? left : 0;
    }
  },
  data() {
    return {
      selectedLabel: null
    };
  },
  methods: {
    close() {
      this.$emit("close");
    },
    save() {
      alert("save");
    }
  }
};
</script>
