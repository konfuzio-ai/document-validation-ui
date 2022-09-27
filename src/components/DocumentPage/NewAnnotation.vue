<style scoped lang="scss" src="../../assets/scss/new_annotation.scss"></style>
<template>
  <div class="annotation-popup" :style="{ left: `${left}px`, top: `${top}px` }">
    <input class="popup-input" type="text" v-model="selectedContent" />
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
        :disabled="loading"
        @click.prevent="close"
      />
      <b-button
        type="is-primary"
        class="popup-button"
        :label="$t('save')"
        :disabled="loading || !selectedContent || !selectedLabel"
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
    entity: {
      type: Object,
      required: true
    },
    content: {
      type: String,
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
    ...mapState("document", ["labels", "documentId"]),
    top() {
      const top = this.entity.scaled.y - heightOfPopup; // subtract the height of the popup plus some margin

      //check if the popup will not go off the container on the top
      return this.entity.scaled.y > heightOfPopup
        ? top
        : this.entity.scaled.y + this.entity.scaled.height + margin;
    },
    left() {
      const left =
        this.entity.scaled.x + this.entity.scaled.width / 2 - widthOfPopup / 2; // add the entity half width to be centered and then subtract half the width of the popup

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
      selectedLabel: null,
      selectedContent: this.content,
      loading: false
    };
  },
  mounted() {
    setTimeout(() => {
      // prevent click propagation when opening the popup
      document.body.addEventListener("click", this.clickOutside);
    }, 200);
  },
  destroyed() {
    document.body.removeEventListener("click", this.clickOutside);
  },
  methods: {
    clickOutside(event) {
      if (!(this.$el == event.target || this.$el.contains(event.target))) {
        this.close();
      }
    },
    close() {
      this.$emit("close");
    },
    save() {
      this.loading = true;
      console.log(this.selectedLabel);
      console.log(this.selectedContent);
      console.log(this.entity);
      const span = {
        ...this.entity.original,
        offset_string: this.selectedContent
      };
      const annotationToCreate = {
        document: this.documentId,
        span: [span],
        label: this.selectedLabel.id,
        annotation_set: this.selectedLabel.annotation_set.id,
        is_correct: true,
        revised: true
      };
      console.log(annotationToCreate);
      this.$store
        .dispatch("document/createAnnotation", annotationToCreate)
        .then(annotationCreated => {
          this.close();
          this.loading = false;
          console.log("annotationCreated", annotationCreated);
        });
    }
  },
  watch: {
    content(newContent) {
      this.selectedContent = newContent;
    }
  }
};
</script>
