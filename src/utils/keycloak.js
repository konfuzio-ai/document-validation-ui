import Keycloak from "keycloak-js";
import API from "../api";

let keycloak;

export const initKeycloak = async (url, realm, clientId) => {
  keycloak = new Keycloak({
    url,
    realm,
    clientId,
  });

  try {
    const authenticated = await keycloak.init({
      onLoad: "login-required",
      enableLogging: true,
    });
    if (authenticated) {
      API.setIsKeycloakAuth(true);
      API.setAuthToken(keycloak.token);
    } else {
      console.error("User is not authenticated");
    }
  } catch (error) {
    console.error("Failed to initialize adapter:", error);
  }
};

export const updateKeycloakToken = () => {
  return new Promise(async (resolve, reject) => {
    if (keycloak) {
      const update = await keycloak.updateToken(30);
      resolve();
    } else {
      reject();
    }
  });
};
