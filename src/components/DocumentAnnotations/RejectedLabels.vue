<style scoped lang="scss" src="../../assets/scss/document_labels.scss"></style>

<template>
  <div class="rejected-label-container">
    <section>
      <b-collapse class="card" animation="slide" :open="false">
        <template #trigger="props">
          <div class="card-header" role="button" :aria-expanded="props.open">
            <p class="card-header-title">
              {{ `${$t("rejected")} (${number})` }}
            </p>
            <a class="card-header-icon">
              <b-icon :icon="props.open ? 'angle-right' : 'angle-down'">
              </b-icon>
            </a>
          </div>
        </template>

        <div class="card-content">
          <div class="content">
            <div class="label-list" v-for="label in labels" :key="label.id">
              <b-field>
                <b-tag
                  v-if="isLabelRejected"
                  attached
                  closable
                  aria-close-label="Close tag"
                  @close="isLabelRejected = false"
                >
                  {{ label.name }}
                </b-tag>
              </b-field>
            </div>
          </div>
        </div>
      </b-collapse>
    </section>
  </div>
</template>

<script>
export default {
  name: "RejectedLabels",
  data() {
    return {
      isLabelRejected: true,
      number: 1
    };
  },
  props: {
    labels: {
      type: Array
    }
  }
};
</script>
