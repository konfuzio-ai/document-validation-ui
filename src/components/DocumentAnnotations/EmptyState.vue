<style scoped lang="scss">
.empty-container {
  width: 100%;
  margin-top: 74px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-family: "Inter", sans-serif;

  svg {
    align-self: center;
  }

  .empty-text {
    align-self: center;

    .title {
      font-size: 16px;
      color: $text;
      font-weight: 500;
      text-align: center;
      margin: 0;
    }

    .description {
      font-size: 14px;
      line-height: 20px;
      color: $text-lighter;
      font-weight: 400;
      text-align: center;
    }
  }
}
</style>
<template>
  <div class="empty-container">
    <EmptyStateImg />
    <div class="empty-text">
      <p class="title">{{ $t("no_label_sets_found") }}</p>
      <p class="description">
        {{ $t("no_label_sets_found_description") }}
      </p>
    </div>
  </div>
</template>
<script>
import EmptyStateImg from "../../assets/EmptyStateImg";
export default {
  name: "EmptyState",
  components: { EmptyStateImg }
};
</script>
