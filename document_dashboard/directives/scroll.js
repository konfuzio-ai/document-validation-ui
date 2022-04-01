function inserted(el, binding) {
  const callback = binding.value;
  if (binding.modifiers.immediate) {
    callback();
  }
  const throttledScroll = throttle(callback, 300);
  el.addEventListener("scroll", throttledScroll, true);
}

function throttle(callback, limit) {
  var waiting = false; // Initially, we're not waiting
  return function() {
    // We return a throttled function
    if (!waiting) {
      // If we're not waiting
      callback.apply(this, arguments); // Execute users function
      waiting = true; // Prevent future invocations
      setTimeout(function() {
        // After a period of time
        waiting = false; // And allow future invocations
      }, limit);
    }
  };
}

export default {
  inserted
};
