import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { store } from "./store";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#edf7ee",
              color: "#1a3a1a",
              borderRadius: "12px",
              boxShadow: "6px 6px 12px rgba(0,50,0,0.13), -6px -6px 12px rgba(255,255,255,0.9)",
              fontFamily: "Inter, sans-serif",
            },
            success: { iconTheme: { primary: "#2e7d32", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef5350", secondary: "#fff" } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
