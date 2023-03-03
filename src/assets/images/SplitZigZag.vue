<template>
  <div>
    <svg
      v-if="color === 'dark'"
      width="6"
      height="57"
      viewBox="0 0 6 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1L5 7.875L1 14.75L5 21.625L1 28.5L5 35.375L1 42.25L5 49.125L1 56"
        stroke="#2B3545"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <svg
      v-if="color === 'green'"
      width="6"
      height="52"
      viewBox="0 0 6 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1.67383L5 7.81966L1 13.9655L5 20.1113L1 26.2572L5 32.403L1 38.5488L5 44.6947L1 50.8405"
        stroke="#44B78B"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script>
export default {
  name: "SplitZigZag",
  props: {
    color: {
      type: String,
      default: null,
      required: false,
    },
  },
};
</script>
