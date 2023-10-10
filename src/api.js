import axios from "axios";
import { cacheAdapterEnhancer } from "axios-extensions";

let HTTP, FILE_REQUEST, authToken, appLocale;
const DEFAULT_URL = "https://app.konfuzio.com";
const FILE_URL = process.env.VUE_APP_DOCUMENT_IMAGES_URL;

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

HTTP = axios.create({
  baseURL: process.env.VUE_APP_API_URL || `${DEFAULT_URL}/api/v3/`,
});

FILE_REQUEST = axios.create({
  baseURL: FILE_URL || `${DEFAULT_URL}`,
  responseType: "blob",
  adapter: cacheAdapterEnhancer(axios.defaults.adapter),
});

const setAuthToken = (token) => {
  authToken = token;
};

const setApiUrl = (url) => {
  HTTP.defaults.baseURL = url;
};

const setFileUrl = (url) => {
  FILE_REQUEST.defaults.baseURL = url;
};

const setLocale = (locale) => {
  appLocale = locale;
};

const getInterceptorConfig = (config) => {
  if (authToken) {
    config.headers["Authorization"] = `Token ${authToken}`;
    config.headers["Accept-Language"] = `${appLocale}-${appLocale}`;
  }
  return config;
};

HTTP.interceptors.request.use(getInterceptorConfig, (error) => {
  return Promise.reject(error);
});

FILE_REQUEST.interceptors.request.use(getInterceptorConfig, (error) => {
  return Promise.reject(error);
});

const makeFileRequest = (fileUrl) => {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === "test") {
      reject("Running unit tests!");
      return;
    }
    FILE_REQUEST.get(fileUrl)
      .then((response) => {
        return response.data;
      })
      .then((myBlob) => {
        resolve(myBlob);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default {
  HTTP,
  setApiUrl,
  setFileUrl,
  makeFileRequest,
  setAuthToken,
  setLocale,
  FILE_REQUEST,
  DEFAULT_URL,
  FILE_URL
};
