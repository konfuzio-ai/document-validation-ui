import Keycloak from "keycloak-js";
import API from "../api";

export const initKeycloak = async () => {
  console.log("initKeycloak");
  const keycloak = new Keycloak({
    url: "https://sso.konfuzio.com",
    realm: "testing",
    clientId: "testing-client",
  });

  try {
    const authenticated = await keycloak.init({
      onLoad: "login-required",
      enableLogging: true,
    });
    if (authenticated) {
      console.log("User is authenticated");
      console.log("token", keycloak.token);
      API.setAuthToken(keycloak.token);
    } else {
      console.log("User is not authenticated");
    }
  } catch (error) {
    console.error("Failed to initialize adapter:", error);
  }
};
