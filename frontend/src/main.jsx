import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AuthProvider } from "./app/AuthContext";
import { TrackerProvider } from "./app/TrackerContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TrackerProvider>
          <App />
        </TrackerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
