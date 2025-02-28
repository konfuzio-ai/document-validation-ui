import { mount, shallowMount } from "@vue/test-utils";
import { $t } from "./i18n";
import store from "../../src/store";

export const render = (component, shallow, props = {}, data = {}) => {
  const values = {
    store,
    props,
    mocks: {
      $t,
    },
    data() {
      return data;
    },
  };

  if (shallow) {
    return shallowMount(component, values);
  } else {
    return mount(component, values);
  }
};
