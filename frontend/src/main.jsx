import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./index.css";
import App from "./App.jsx";
import { UISettingsProvider } from "./context/UISettingsContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UISettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </BrowserRouter>
      </AuthProvider>
    </UISettingsProvider>
  </React.StrictMode>
);
