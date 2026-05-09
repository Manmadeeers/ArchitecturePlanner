export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "",
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || "",
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
  logoutReturnTo: import.meta.env.VITE_AUTH0_LOGOUT_RETURN_TO || import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
};

export const isAuthConfigured = Boolean(auth0Config.domain && auth0Config.clientId && auth0Config.audience);
