import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { HotelProvider } from "./context/HotelContext";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <HotelProvider>
          <App />
        </HotelProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
