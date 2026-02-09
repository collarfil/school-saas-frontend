import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast"; // ✅ Proper import added

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* ✅ Global Toaster container */}
    <Toaster position="top-right" reverseOrder={false} />
  </React.StrictMode>
);
