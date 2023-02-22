<template>
  <b-tooltip
    :animated="false"
    position="is-bottom"
    class="left-aligned annotation-details"
  >
    <div class="label-icon">
      <div v-if="created(annotation) || edited(annotation)">
        <div
          v-if="accepted(annotation)"
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
        v-else-if="notFound(annotation)"
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
          v-if="accepted(annotation)"
          :class="[
            'annotation-details-icon success',
            animate ? 'animated-ripple' : '',
          ]"
        >
          <AcceptedCheckMark />
        </div>
        <div
          v-else
          :class="['annotation-details-icon', animate ? 'animated-ripple' : '']"
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
        <div v-if="confidence(annotation)" class="confidence">
          <span>{{ $t("confidence") }}</span
          ><span
            :class="[
              'value',
              confidence(annotation) <= 0.2
                ? 'red'
                : confidence(annotation) <= 0.5
                ? 'yellow'
                : '',
            ]"
            >{{ Math.floor(confidence(annotation) * 100) / 100 }}</span
          >
        </div>
        <div class="revision">
          <div class="detail-icons">
            <div v-if="created(annotation) || edited(annotation)">
              <div
                v-if="accepted(annotation)"
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
              v-else-if="notFound(annotation)"
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
                v-if="accepted(annotation)"
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
import { mapGetters } from "vuex";
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
    ...mapGetters("document", [
      "confidence",
      "notFound",
      "created",
      "edited",
      "accepted",
      "getUser",
    ]),
  },
  watch: {
    annotation(newAnnotation, oldAnnotation) {
      // animate an annotation being accepted
      if (
        newAnnotation &&
        newAnnotation.id &&
        this.accepted(newAnnotation) &&
        !this.accepted(oldAnnotation)
      ) {
        this.animate = true;
        setTimeout(() => {
          this.animate = false;
        }, 2000);
      }
    },
  },
  mounted() {
    this.changePositionOfTooltip();
  },
  methods: {
    getText() {
      if (this.notFound(this.annotation)) {
        return this.$t("not_found_in_document");
      } else if (this.created(this.annotation)) {
        return this.getUser(this.annotation)
          ? `${this.$t("created_by")} ${this.getUser(this.annotation)}`
          : this.$t("created");
      } else if (this.accepted(this.annotation)) {
        return this.getUser(this.annotation)
          ? `${this.$t("approved_by")} ${this.getUser(this.annotation)}`
          : this.$t("approved");
      } else {
        return this.$t("not_revised_yet");
      }
    },
    changePositionOfTooltip() {
      // Get all elements
      const annDetails = document.getElementsByClassName("annotation-details");

      // Only last 3 rows will change the position
      if (annDetails) {
        let lastElementsInList;

        if (annDetails.length >= 3) {
          lastElementsInList = annDetails.length - 2;
        } else {
          return;
        }

        for (let i = lastElementsInList; i < annDetails.length; i++) {
          this.updateClass(annDetails, i);
        }
      }
    },
    updateClass(array, index) {
      if (!array[index]) return;

      array[index].classList.remove("is-bottom");
      array[index].classList.add("is-top");
    },
  },
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/annotation_details.scss"
></style>
