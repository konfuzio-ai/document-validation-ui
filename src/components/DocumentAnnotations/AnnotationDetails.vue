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
            'user-icon success',
          ]"
        >
          <AcceptedUser />
        </div>
        <div
          v-else
          :class="[
            'annotation-details-icon',
            animate ? 'animated-ripple' : '',
            'user-icon pending',
          ]"
        >
          <UserIcon />
        </div>
      </div>
      <div
        v-else-if="notFound"
        :class="[
          'annotation-details-icon',
          animate ? 'animated-ripple' : '',
          'question-icon pending',
        ]"
      >
        <QuestionMark />
      </div>
      <div v-else>
        <div
          v-if="accepted"
          :class="[
            'annotation-details-icon success',
            animate ? 'animated-ripple' : '',
          ]"
        >
          <AcceptedCheckMark />
        </div>
        <div
          v-else
          :class="[
            'annotation-details-icon pending',
            animate ? 'animated-ripple' : '',
          ]"
        >
          <CheckMark class="pending" />
        </div>
      </div>
    </div>

    <template #content>
      <div class="label-details">
        <div v-if="description" class="label-description">
          <span>{{ description }}</span>
        </div>
        <div v-if="accuracy" class="accuracy">
          <span>{{ $t("accuracy") }}</span
          ><span
            :class="[
              'value',
              accuracy <= 0.2 ? 'red' : accuracy <= 0.5 ? 'yellow' : '',
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
                  'user-icon',
                ]"
              >
                <AcceptedUser />
              </div>
              <div
                v-else
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : '',
                  'user-icon',
                ]"
              >
                <UserIcon />
              </div>
            </div>
            <div
              v-else-if="notFound"
              :class="[
                'annotation-details-icon',
                animate ? 'animated-ripple' : '',
                'question-icon',
              ]"
            >
              <QuestionMark />
            </div>
            <div v-else>
              <div
                v-if="accepted"
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : '',
                ]"
              >
                <AcceptedCheckMark />
              </div>
              <div
                v-else
                :class="[
                  'annotation-details-icon',
                  animate ? 'animated-ripple' : '',
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
import UserIcon from "../../assets/images/UserIcon";

export default {
  name: "AnnotationDetails",
  components: {
    CheckMark,
    QuestionMark,
    AcceptedCheckMark,
    AcceptedUser,
    UserIcon,
  },
  props: {
    description: {
      type: String,
      default: null,
      required: false,
    },
    annotation: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      animate: false,
    };
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
        return this.annotation.revised && this.annotation.is_correct;
      } else {
        return null;
      }
    },
    declined() {
      // TODO: add this verification to store
      if (this.annotation) {
        return this.annotation.revised && !this.annotation.is_correct;
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
    },
  },
  watch: {
    annotation(newAnnotation, oldAnnotation) {
      // animate an annotation being accepted
      // TODO: add this accepted check to store
      const accepted = (ann) => {
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
    },
  },
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
      } else if (this.declined) {
        return this.user
          ? `${this.$t("declined_by")} ${this.user}`
          : this.$t("declined");
      } else {
        return this.$t("not_revised_yet");
      }
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/annotation_details.scss"
></style>
