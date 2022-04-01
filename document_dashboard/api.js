import axios from "axios";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

const docId = process.env.DOCUMENT_ID;
const baseURL = process.env.API_URL;

const HTTP = axios.create({
  baseURL
});

export default {
  axios,
  HTTP,
  docId,
  baseURL
};
