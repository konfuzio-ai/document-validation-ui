<template>
  <div class="keyboard-actions-description">
    <section class="b-tooltips">
      <b-tooltip
        label="Tooltip large multilined, because it's too long to be on a medium size. Did I tell you it's really long? Yes, it is — I assure you!"
        position="is-left"
        size="is-large"
        multilined
      >
        <KeyboardIcon />
      </b-tooltip>
    </section>
  </div>
</template>

<script>
import KeyboardIcon from "../../assets/images/KeyboardIcon";

export default {
  name: "KeyboardActionsDescription",
  components: {
    KeyboardIcon,
  },
};
</script>
