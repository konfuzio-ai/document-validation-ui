<style scoped lang="scss" src="../../assets/scss/label_details.scss"></style>
<template>
  <b-tooltip
    type="is-dark"
    :animated="false"
    position="is-bottom"
    class="left-aligned"
  >
    <div class="label-icon">
      <b-icon
        v-if="notFound"
        :class="[animate ? 'animated-ripple' : '', 'red']"
        icon="xmark"
        size="is-small"
      />
      <b-icon
        v-else-if="created"
        :class="[animate ? 'animated-ripple' : '']"
        icon="user"
        size="is-small"
      />
      <b-icon
        v-else-if="accepted"
        :class="[animate ? 'animated-ripple' : '', 'green']"
        icon="check"
        size="is-small"
      />
      <b-icon v-else icon="check" size="is-small" />
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
          <div class="not-found" v-if="notFound">
            <b-icon icon="xmark" size="is-small" />{{
              $t("not_found_in_document")
            }}
          </div>
          <div class="created" v-else-if="created">
            <b-icon icon="user" size="is-small" class="grey" />{{
              user ? `${$t("created_by")} ${user}` : $t("created")
            }}
          </div>
          <div class="accepted" v-else-if="accepted">
            <b-icon icon="check" size="is-small" />{{
              user ? `${$t("approved_by")} ${user}` : $t("approved")
            }}
          </div>
          <div class="not-revised" v-else>
            <b-icon icon="check" size="is-small" />{{ $t("not_revised_yet") }}
          </div>
        </div>
      </div>
    </template>
  </b-tooltip>
</template>
<script>
export default {
  name: "LabelDetails",
  computed: {
    accuracy() {
      if (this.annotation) {
        return this.annotation.confidence;
      } else {
        return null;
      }
    },
    notFound() {
      if (this.annotation) {
        return !this.annotation.span;
      } else {
        return true;
      }
    },
    created() {
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
    accepted() {
      if (this.annotation) {
        return this.annotation.revised && this.annotation.is_correct;
      } else {
        return null;
      }
    },
    user() {
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
  data() {
    return {
      animate: false
    };
  },
  watch: {
    annotation(newAnnotation, oldAnnotation) {
      const accepted = ann => {
        return ann && ann.id && ann.revised && ann.is_correct;
      };
      if (
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
