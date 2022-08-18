<style
  scoped
  lang="scss"
  src="../../assets/scss/document_annotations.scss"
></style>

<template>
  <div class="rejected-label-container">
    <p class="title">
      {{ `${$t("rejected")} (${rejectedLabelList.length})` }}
    </p>
    <section class="tag-container">
      <b-taglist v-for="label in rejectedLabelList" :key="label.id">
        <b-tag
          attached
          closable
          aria-close-label="Close tag"
          @close="removeRejectedLabel(label.id)"
        >
          {{ label.name }}
        </b-tag>
      </b-taglist>
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
    return {};
  },
  props: {
    rejectedLabelList: {
      type: Array
    },
    missingAnnotations: {
      type: Array
    }
  },
  methods: {
    removeRejectedLabel(id) {
      console.log("removing", id);
    }
  }
};
</script>
