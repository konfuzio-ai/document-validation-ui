<template>
  <div class="empty-container">
    <EmptyStateImg />
    <div class="empty-text">
      <p class="title">
        {{ $t("no_label_sets_found") }}
      </p>
      <p v-if="!isSearch" class="description">
        {{ $t("no_label_sets_found_description") }}
      </p>
    </div>
  </div>
</template>
<script>
import EmptyStateImg from "../../assets/images/EmptyStateImg";
export default {
  name: "EmptyState",
  components: { EmptyStateImg },
  props: {
    isSearch: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
};
</script>
<style scoped lang="scss" src="../../assets/scss/empty_state.scss"></style>
