import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { auth0Config, isAuthConfigured } from "./auth-config";
import App from "./App";
import { I18nProvider } from "./i18n";
import "./styles.css";

const app = (
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  isAuthConfigured ? (
    <Auth0Provider
      cacheLocation="localstorage"
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        audience: auth0Config.audience,
        redirect_uri: auth0Config.redirectUri,
        scope: "openid profile email",
      }}
    >
      {app}
    </Auth0Provider>
  ) : (
    app
  ),
);
