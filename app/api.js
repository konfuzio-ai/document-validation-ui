import axios from "axios";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

const HTTP = axios.create({
  baseURL: process.env.API_URL || `/api/v3/`
});

export default {
  axios,
  HTTP
};
