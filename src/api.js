import axios from "axios";
import {
  cacheAdapterEnhancer
} from 'axios-extensions';

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

const DEFAULT_URL = "https://app.konfuzio.com";

if (process.env.VUE_APP_GUEST_USER_TOKEN) {
  axios.defaults.headers.common[
    "Authorization"
  ] = `Token ${process.env.VUE_APP_GUEST_USER_TOKEN}`;
}

const HTTP = axios.create({
  baseURL: process.env.VUE_APP_API_URL || `${DEFAULT_URL}/api/v3/`
});

const IMG_REQUEST = axios.create({
  baseURL: process.env.VUE_APP_DOCUMENT_IMAGES_URL || `${DEFAULT_URL}`,
  responseType: "blob",
  adapter: cacheAdapterEnhancer(axios.defaults.adapter)
});

export default {
  axios,
  HTTP,
  IMG_REQUEST
};