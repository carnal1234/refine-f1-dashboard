import React from "react";
import { createRoot } from "react-dom/client";

import "./style/global.scss";
import App from "./App";
import { LoadingProvider } from "./context/LoadingContext";
import { Analytics } from '@vercel/analytics/react';


const container = document.getElementById("root");
// eslint-disable-next-line
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <LoadingProvider>
      <App />
      <Analytics />
    </LoadingProvider>
  </React.StrictMode>,
);
