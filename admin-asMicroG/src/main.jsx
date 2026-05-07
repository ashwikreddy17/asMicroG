import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e321e", color: "#e8f5e9",
            borderRadius: "10px", border: "1px solid rgba(76,175,80,0.2)",
            fontFamily: "Inter, sans-serif", fontSize: "0.9rem",
          },
          success: { iconTheme: { primary: "#4caf50", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef5350", secondary: "#fff" } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
