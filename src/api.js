import axios from "axios";

let HTTP, FILE_REQUEST, authToken, appLocale;
const DEFAULT_URL = "https://app.konfuzio.com";
const FILE_URL = process.env.VUE_APP_IMAGE_URL;

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

HTTP = axios.create({
  baseURL: process.env.VUE_APP_API_URL || `${DEFAULT_URL}/api/v3/`,
});

FILE_REQUEST = axios.create({
  baseURL: FILE_URL || `${DEFAULT_URL}`,
  responseType: "blob",
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

const makeGetPaginatedRequest = (request, hasParams = false) => {
  let returnResponse = [];
  let toFinishLoop = false;

  let separator = hasParams ? "&" : "?";
  let loopRequest = `${request}${separator}limit=100`;

  return new Promise(async (resolve, reject) => {
    do {
      try {
        let response = await HTTP.get(loopRequest);
        if (response && response.data) {
          const data = response.data;
          if (data.results) {
            returnResponse = [...returnResponse, ...data.results];
          }
          if (data.next) {
            loopRequest = data.next;
          } else {
            toFinishLoop = true;
          }
        } else {
          reject("Error getting paginated results.");
        }
      } catch (error) {
        reject(error);
        console.log(error);
      }
    } while (!toFinishLoop);
    resolve(returnResponse);
  });
};

export default {
  HTTP,
  setApiUrl,
  setFileUrl,
  makeFileRequest,
  makeGetPaginatedRequest,
  setAuthToken,
  setLocale,
  FILE_REQUEST,
  DEFAULT_URL,
  FILE_URL,
};
