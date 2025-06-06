import axios from "axios";
import { updateKeycloakToken } from "./utils/keycloak";

let HTTP, FILE_REQUEST, authToken, appLocale, isKeycloakAuth;
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
  if (token !== authToken) {
    authToken = token;
  }
};

const setIsKeycloakAuth = (result) => {
  isKeycloakAuth = result;
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

const getInterceptorConfig = async (config) => {
  if (isKeycloakAuth) {
    await updateKeycloakToken();
  }

  if (authToken) {
    config.headers["Authorization"] = `${isKeycloakAuth ? "Bearer" : "Token"
      } ${authToken}`;
  }
  config.headers["Accept-Language"] = `${appLocale}-${appLocale}`;

  return config;
};

HTTP.interceptors.request.use(getInterceptorConfig, async (error) => {
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
        if (error.response.status === 428) {
          // retry request after 2 seconds
          setTimeout(() => {
            makeFileRequest(fileUrl)
              .then((response) => {
                resolve(response);
              })
              .catch((error) => {
                reject(error);
              });
          }, 2000);
        }
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
        toFinishLoop = true;
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
  setIsKeycloakAuth,
  setLocale,
  FILE_REQUEST,
  DEFAULT_URL,
  FILE_URL,
};
