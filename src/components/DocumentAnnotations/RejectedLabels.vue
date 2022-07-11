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
/**
 * TODO when backend ready:
 * Get an array of rejected labels, and be able to "toggle" the status (rejected or not)
 * by sending a request to the backend
 */

/**
 * To take into account:
 * - might need to keep a state with all the labels indeces
 * to be able to return them to their original place in the array, if "unrejected"
 * - Need to try more solutions to have the menu open to the top but be fully visible
 */

export default {
  name: "RejectedLabels",
  data() {
    return {
      isLabelRejected: true,
      number: null
    };
  },
  props: {
    labels: {
      type: Array
    }
  }
};
</script>
