import { mount, shallowMount } from "@vue/test-utils";
import { $t } from "./i18n";
import store from "../../src/store";

export const render = (component, shallow, propsData = {}, data = {}) => {
  const values = {
    store,
    propsData,
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
