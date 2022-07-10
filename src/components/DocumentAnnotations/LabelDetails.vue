<style scoped lang="scss" src="../../assets/scss/label_details.scss"></style>
<template>
  <b-tooltip type="is-dark" :animated="false">
    <slot></slot>
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
            <b-icon icon="xmark" size="is-small" />Not found in the document
          </div>
          <div class="approved" v-if="approved">
            <b-icon icon="check" size="is-small" />Approved by user
          </div>
          <div class="edited" v-if="edited">
            <b-icon icon="user" size="is-small" />Edited by user
          </div>
          <div class="not-revised" v-else>
            <b-icon icon="check" size="is-small" />Not revised yed
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
