<style
  scoped
  lang="scss"
  src="../../assets/scss/annotation_details.scss"
></style>
<template>
  <b-tooltip
    type="is-dark"
    :animated="false"
    position="is-bottom"
    class="left-aligned annotation-details"
  >
    <div class="label-icon">
      <div v-if="created || edited">
        <div
          v-if="accepted"
          :class="[
            'annotation-details-icon',
            animate ? 'animated-ripple' : '',
            'user-icon'
          ]"
        >
          <AcceptedUser />
        </div>
        <div
          v-else
          :class="[
            'annotation-details-icon',
            animate ? 'animated-ripple' : '',
            'user-icon'
          ]"
        >
          <User />
        </div>
      </div>
      <div
        v-else-if="notFound"
        :class="[
          'annotation-details-icon',
          animate ? 'animated-ripple' : '',
          'question-icon'
        ]"
      >
        <QuestionMark />
      </div>
      <div v-else>
        <div
          v-if="accepted"
          :class="['annotation-details-icon', animate ? 'animated-ripple' : '']"
        >
          <AcceptedCheckMark />
        </div>
        <div
          v-else
          :class="['annotation-details-icon', animate ? 'animated-ripple' : '']"
        >
          <CheckMark />
        </div>
      </div>
    </div>

    <template v-slot:content>
      <div class="label-details">
        <div class="label-description" v-if="description">
          <span>{{ description }}</span>
        </div>
        <div class="accuracy" v-if="accuracy">
          <span>{{ $t("accuracy") }}</span
          ><span
            :class="[
              'value',
              accuracy <= 0.2 ? 'red' : accuracy <= 0.5 ? 'yellow' : ''
            ]"
            >{{ Math.floor(accuracy * 100) / 100 }}</span
          >
        </div>
        <div class="revision">
          <div class="detail-icons">
            <div v-if="created || edited">
              <div
                v-if="accepted"
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : '',
                  'user-icon'
                ]"
              >
                <AcceptedUser />
              </div>
              <div
                v-else
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : '',
                  'user-icon'
                ]"
              >
                <User />
              </div>
            </div>
            <div
              v-else-if="notFound"
              :class="[
                'annotation-details-icon',
                animate ? 'animated-ripple' : '',
                'question-icon'
              ]"
            >
              <QuestionMark />
            </div>
            <div v-else>
              <div
                v-if="accepted"
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : ''
                ]"
              >
                <AcceptedCheckMark />
              </div>
              <div
                v-else
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : ''
                ]"
              >
                <CheckMark />
              </div>
            </div>
            {{ getText() }}
          </div>
        </div>
      </div>
    </template>
  </b-tooltip>
</template>
<script>
import CheckMark from "../../assets/images/CheckMark";
import AcceptedCheckMark from "../../assets/images/AcceptedCheckMark";
import QuestionMark from "../../assets/images/QuestionMark";
import AcceptedUser from "../../assets/images/AcceptedUser";
import User from "../../assets/images/User";

export default {
  name: "AnnotationDetails",
  methods: {
    getText() {
      if (this.notFound) {
        return this.$t("not_found_in_document");
      } else if (this.created) {
        return this.user
          ? `${this.$t("created_by")} ${this.user}`
          : this.$t("created");
      } else if (this.accepted) {
        return this.user
          ? `${this.$t("approved_by")} ${this.user}`
          : this.$t("approved");
      } else {
        return this.$t("not_revised_yet");
      }
    }
  },
  computed: {
    accuracy() {
      // TODO: add this verification to store
      if (this.annotation) {
        return this.annotation.confidence;
      } else {
        return null;
      }
    },
    notFound() {
      // TODO: add this verification to store
      if (this.annotation) {
        return !this.annotation.span;
      } else {
        return true;
      }
    },
    created() {
      // TODO: add this verification to store
      if (this.annotation) {
        return (
          this.annotation.created_by &&
          !this.annotation.revised &&
          this.annotation.is_correct
        );
      } else {
        return null;
      }
    },
    edited() {
      // TODO: add this verification to store
      if (this.annotation) {
        if (
          this.annotation.offset_string !==
          this.annotation.offset_string_original
        ) {
          return true;
        } else if (this.annotation.created_by) {
          return true;
        } else {
          return false;
        }
      } else {
        return null;
      }
    },
    accepted() {
      // TODO: add this verification to store
      if (this.annotation) {
        return this.annotation.revised;
      } else {
        return null;
      }
    },
    user() {
      // TODO: add this verification to store
      if (this.annotation) {
        if (this.annotation.created_by && !this.annotation.revised) {
          // If the annotation was created but not yet revised
          // we show who created it
          return this.annotation.created_by;
        } else if (this.annotation.revised && this.annotation.revised_by) {
          return this.annotation.revised_by;
        } else {
          // If both revised_by and created_by are null, we don't show any user
          return null;
        }
      } else {
        return null;
      }
    }
  },
  props: {
    description: {
      required: true
    },
    annotation: {
      default: null
    }
  },
  components: {
    CheckMark,
    QuestionMark,
    AcceptedCheckMark,
    AcceptedUser,
    User
  },
  data() {
    return {
      animate: false
    };
  },
  watch: {
    annotation(newAnnotation, oldAnnotation) {
      // animate an annotation being accepted
      // TODO: add this accepted check to store
      const accepted = ann => {
        return ann && ann.id && ann.revised && ann.is_correct;
      };
      if (
        newAnnotation &&
        newAnnotation.id &&
        accepted(newAnnotation) &&
        !accepted(oldAnnotation)
      ) {
        this.animate = true;
        setTimeout(() => {
          this.animate = false;
        }, 2000);
      }
    }
  }
};
</script>
