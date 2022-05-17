import axios from "axios";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

if (process.env.VUE_APP_GUEST_USER_TOKEN) {
  axios.defaults.headers.common[
    "Authorization"
  ] = `Token ${process.env.VUE_APP_GUEST_USER_TOKEN}`;
}

const HTTP = axios.create({
  baseURL: process.env.VUE_APP_API_URL || `/api/v3/`
});

export default {
  axios,
  HTTP
};
