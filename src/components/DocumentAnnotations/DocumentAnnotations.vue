<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div class="labels-sidebar">
    <!-- When extracting annotations after rotating -->
    <div v-if="recalculatingAnnotations">
      <ExtractingData />
    </div>
    <!-- When there's no annotations in the label -->
    <div v-else-if="!annotationSets || annotationSets.length === 0">
      <EmptyState />
    </div>
    <div
      v-else
      :class="['labels-list', missingAnnotations.length && 'showing-rejected']"
    >
      <div
        v-for="(annotationSet, indexGroup) in annotationSets"
        v-bind:key="indexGroup"
        class="labelset-group"
      >
        <div class="label-set-name">
          {{
            `${annotationSet.label_set.name} ${getNumberOfAnnotationSetGroup(
              annotationSet
            )}`
          }}
        </div>
        <div v-for="label in annotationSet.labels" :key="label.id">
          <Label
            v-if="label.id === labelNotRejected(label)"
            :label="label"
            :annotationSet="annotationSet"
            :handleScroll="handleScroll"
            :indexGroup="indexGroup"
            :handleError="handleShowError"
            :handleMessage="handleShowMessage"
            :reject="reject"
            @handle-menu="rejectAnnotation"
            :missingAnnotations="missingAnnotations"
            @cancel-editing="cancelEditing"
          />
        </div>
      </div>
    </div>
    <div
      v-if="showRejectedLabels && missingAnnotations.length"
      class="rejected-labels-list"
    >
      <RejectedLabels
        :missingAnnotations="missingAnnotations"
        :handleError="handleShowError"
        :handleMessage="handleShowMessage"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import EmptyState from "./EmptyState";
import ExtractingData from "./ExtractingData";
import CaretDown from "../../assets/images/CaretDownImg";
import ActionButtons from "./ActionButtons";
import Label from "./Label";
import RejectedLabels from "./RejectedLabels.vue";
/**
 * This component loads all annotations in a label set
 */
export default {
  components: {
    EmptyState,
    ExtractingData,
    CaretDown,
    ActionButtons,
    Label,
    RejectedLabels
  },
  props: {
    scroll: {
      type: Boolean
    },
    handleScroll: {
      type: Function
    }
  },
  data() {
    return {
      count: 0,
      reject: null
    };
  },
  computed: {
    ...mapState("document", [
      "recalculatingAnnotations",
      "annotationSets",
      "missingAnnotations",
      "showRejectedLabels"
    ])
  },
  created() {
    window.addEventListener("keydown", this.keyDownHandler);
  },
  destroyed() {
    window.removeEventListener("keydown", this.keyDownHandler);
  },
  methods: {
    keyDownHandler(event) {
      // validate the arrow up or down key
      if (event.key === "ArrowDown") {
        if (this.count === 0) {
          document.getElementsByClassName("annotation-value")[0].click();
        }
        this.count++;
        document.getElementsByClassName("annotation-value")[this.count].click();
      } else if (event.key === "ArrowUp") {
        if (this.count === 0) return;
        this.count--;
        document.getElementsByClassName("annotation-value")[this.count].click();
      }

      // get out of edit mode and navigation
      if (event.key === "Escape") {
        this.count = 0;
      }
    },
    cancelEditing() {
      this.count = 0;
    },
    getNumberOfAnnotationSetGroup(annotationSet) {
      // This method checks if theres a group of annotation sets and add an index number to them
      let found = false;
      let value = 0;
      let index = 0;
      this.annotationSets.map(annotationSetTemp => {
        if (
          annotationSetTemp.label_set.name === annotationSet.label_set.name &&
          annotationSetTemp.id !== annotationSet.id
        ) {
          found = true;
          index++;
        } else if (annotationSetTemp.id === annotationSet.id) {
          value = index;
        }
      });
      return found ? `${value + 1}` : "";
    },
    labelNotRejected(label) {
      if (this.missingAnnotations.length === 0) {
        return label.id;
      } else {
        const found = this.missingAnnotations.find(l => l.label === label.id);

        if (found) {
          return 0;
        } else {
          return label.id;
        }
      }
    },
    handleShowError() {
      this.$emit("handle-error");
    },
    handleShowMessage(message) {
      this.$emit("handle-message", message);
    },
    rejectAnnotation(rejected) {
      console.log("rejected", rejected);
      if (!rejected) return;

      this.$store
        .dispatch("document/addMissingAnnotation", rejected)
        .then(response => {
          if (response) {
            this.$store.dispatch("document/fetchMissingAnnotations");
          } else {
            this.handleShowError();
            this.handleShowMessage(this.$i18n.t("ann_exists"));
          }
        });
    }
  }
};
</script>
