<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>
<template>
  <div
    :class="['label-properties', isAnnotationSelected() && 'selected']"
    :ref="`label_${label.id}_${annotationSet.id}`"
    @click="onLabelClick()"
  >
    <div class="label-property-left">
      <LabelDetails :description="label.description" :annotation="annotation" />
      <div class="label-property-name">
        <span class="label-property-text">{{ label.name }} </span>
      </div>
    </div>
    <div class="label-property-right">
      <div class="label-property-annotation">
        <Annotation
          v-if="annotation"
          :annotation="annotation"
          :isLoading="isLoading"
          :edited="edited"
          :notEditing="notEditing"
          :annBeingEdited="annBeingEdited"
          :isAnnotationBeingEditedNull="isAnnotationBeingEditedNull"
          @handle-data-changes="handleDataChanges"
          @handle-show-error="handleError"
        />
        <EmptyAnnotation
          v-else
          :label="label"
          :annotationSet="annotationSet"
          @handle-data-changes="handleDataChanges"
        />
      </div>
    </div>
    <!-- <transition name="slide-fade">
      <div
        v-if="showWarning"
        :class="[
          'message',
          !notEditing && annotation.id !== annBeingEdited.id && 'hidden'
        ]"
      >
        <b-message class="is-warning">
          <div class="message-container">
            {{ $t("warning_message") }}
            <div @click="handleWarningClose" class="btn-container">
              <b-icon icon="xmark" class="close-btn" />
            </div>
          </div>
        </b-message>
      </div>
    </transition> -->
    <transition name="slide-fade">
      <div
        v-if="showError"
        :class="[
          'message',
          !edited && annotation.id !== annBeingEdited.id && 'hidden'
        ]"
      >
        <b-message class="is-danger">
          <div class="message-container">
            {{ $t("error_message") }}
            <div @click="handleErrorClose" class="btn-container">
              <b-icon icon="xmark" class="close-btn" />
            </div>
          </div>
        </b-message>
      </div>
    </transition>
  </div>
</template>
<script>
import { mapState } from "vuex";
import LabelDetails from "./LabelDetails";
import Annotation from "./Annotation";
import EmptyAnnotation from "./EmptyAnnotation";
/**
 * This component shows each label
 */
export default {
  name: "Label",
  components: { LabelDetails, Annotation, EmptyAnnotation },
  props: {
    label: {
      required: true
    },
    annotationSet: {
      required: true
    }
  },
  computed: {
    ...mapState("document", ["sidebarAnnotationSelected"]),
    labelHasAnnotations() {
      return (
        this.label &&
        this.label.annotations &&
        this.label.annotations.length > 0
      );
    },
    annotation() {
      if (this.labelHasAnnotations) {
        return this.label.annotations[0];
      } else {
        return null;
      }
    }
  },
  data() {
    return {
      edited: false,
      notEditing: true,
      // showWarning: false,
      showError: false,
      annBeingEdited: null,
      isLoading: false,
      annotationAnimationTimeout: null
    };
  },
  methods: {
    handleDataChanges({ annotation, notEditing, edited, isLoading }) {
      if (annotation !== null) {
        if (!this.labelHasAnnotations) {
          this.label.annotations = [annotation];
        } else {
          this.annBeingEdited = annotation;
        }
      }

      if (notEditing !== null) {
        this.notEditing = notEditing;
      }

      if (edited !== null) {
        this.edited = edited;
      }

      if (isLoading !== null) {
        this.isLoading = isLoading;
      }
    },
    onLabelClick() {
      if (this.annotation) {
        const annotation = { ...this.annotation };
        annotation.label_name = this.label.name;
        this.$store.dispatch(
          "document/setDocumentFocusedAnnotation",
          annotation
        );
      } else {
        this.$store.dispatch("document/setDocumentFocusedAnnotation", null);
      }
    },
    isAnnotationBeingEditedNull() {
      if (this.annBeingEdited.id === null) {
        return false;
      } else {
        return this.annBeingEdited.id;
      }
    },
    isAnnotationSelected() {
      if (this.annotation) {
        return (
          this.sidebarAnnotationSelected &&
          this.annotation.id === this.sidebarAnnotationSelected.id
        );
      }
      return false;
    },
    // handleWarning(value) {
    //   this.showWarning = value;
    // },
    // handleWarningClose() {
    //   this.showWarning = false;
    // },
    handleError(value) {
      this.showError = value;
    },
    handleErrorClose() {
      this.showError = false;
    }
  },
  watch: {
    sidebarAnnotationSelected() {
      // if an annotation is selected, scroll to it
      if (
        this.sidebarAnnotationSelected &&
        this.annotation &&
        this.sidebarAnnotationSelected.id === this.annotation.id
      ) {
        const refId = `label_${this.label.id}_${this.annotationSet.id}`;
        clearTimeout(this.annotationAnimationTimeout);
        setTimeout(() => {
          if (this.$refs[`${refId}`] === undefined) {
            return;
          }

          this.$refs[`${refId}`].scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
          });

          // remove annotation selection after some time
          this.annotationAnimationTimeout = setTimeout(() => {
            this.$store.dispatch("document/setSidebarAnnotationSelected", null);
          }, 1500);
        }, 100);
        // add a timeout in case we need to wait if a tab is going to be changed
      }
    }
  }
};
</script>
