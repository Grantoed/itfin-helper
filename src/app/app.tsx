import React from "react";
import Popup from "./popup/popup";
import "../styles/globals.scss";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
