import { mount, shallowMount } from "@vue/test-utils";
import { $t } from "./i18n";
import Buefy from "buefy";
import VueObserveVisibility from "vue3-observe-visibility";
import { init as initStore } from "./store";

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return null;
  }

  unobserve() {
    return null;
  }
};

export const render = (component, shallow, props = {}, data = {}) => {
  const values = {
    props,
    data() {
      return data;
    },
    global: {
      mocks: {
        $t,
      },
      plugins: [initStore(), Buefy, VueObserveVisibility],
    },
  };

  if (shallow) {
    return shallowMount(component, values);
  } else {
    return mount(component, values);
  }
};
