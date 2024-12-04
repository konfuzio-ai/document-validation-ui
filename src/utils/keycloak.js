import Keycloak from "keycloak-js";
import API from "../api";

export const initKeycloak = async (url, realm, clientId) => {
  const keycloak = new Keycloak({
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
