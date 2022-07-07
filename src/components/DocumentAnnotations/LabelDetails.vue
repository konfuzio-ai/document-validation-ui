<style scoped lang="scss" src="../../assets/scss/label_details.scss"></style>
<template>
  <b-tooltip>
    <slot></slot>
    <template v-slot:content>
      <div class="label-details">
        <div class="description" v-if="description">{{ description }}</div>
        <div class="accuracy" v-if="accuracy">
          <span>{{ $t("accuracy") }}</span
          ><span class="value">{{ accuracy }}</span>
        </div>
        <div class="revision"></div>
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
    revision: {
      required: true
    }
  },
  methods: {}
};
</script>
