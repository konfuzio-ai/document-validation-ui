<style scoped lang="scss" src="../../assets/scss/label_details.scss"></style>
<template>
  <b-tooltip type="is-dark" :animated="false">
    <div class="label-icon">
      <b-icon v-if="notFound" class="red" icon="xmark" size="is-small" />
      <b-icon v-else-if="approved" class="green" icon="check" size="is-small" />
      <b-icon v-else-if="edited" class="green" icon="user" size="is-small" />
      <b-icon v-else icon="check" size="is-small" />
    </div>

    <template v-slot:content>
      <div class="label-details">
        <div class="description" v-if="description">{{ description }}</div>
        <div class="accuracy" v-if="accuracy">
          <span>{{ $t("accuracy") }}</span
          ><span
            :class="[
              'value',
              accuracy <= 0.2 ? 'red' : accuracy <= 0.5 ? 'yellow' : ''
            ]"
            >{{ accuracy }}</span
          >
        </div>
        <div class="revision">
          <div class="not-found" v-if="notFound">
            <b-icon icon="xmark" size="is-small" />{{
              $t("not_found_in_document")
            }}
          </div>
          <div class="approved" v-else-if="approved">
            <b-icon icon="check" size="is-small" />{{ $t("approved_by_user") }}
          </div>
          <div class="edited" v-else-if="edited">
            <b-icon icon="user" size="is-small" />{{ $t("edited_by_user") }}
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
  props: {
    description: {
      required: true
    },
    accuracy: {
      required: true
    },
    revised: {
      required: true
    },
    notFound: {
      required: true
    },
    approved: {
      required: true
    },
    edited: {
      required: true
    }
  },
  methods: {}
};
</script>
