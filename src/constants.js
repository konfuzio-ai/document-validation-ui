export const PIXEL_RATIO = window.devicePixelRatio || 1;
export const VIEWPORT_RATIO = 0.98;
export const MINIMUM_APP_WIDTH = 600;
export const MINIMUM_OPTIMIZED_APP_WIDTH = 950;
export const TEXT_BREAKPOINT_WIDTH = (locale) => {
  if (locale === "en") {
    return 1350;
  } else {
    return 1800;
  }
};
