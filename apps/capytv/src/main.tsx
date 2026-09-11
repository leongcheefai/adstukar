import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The shell has to survive a network drop, or a screen that reloads overnight
// comes back to a browser error instead of a clock. The batch and the report
// queue live in localStorage, so the worker only has to cache the shell.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // No worker means no offline shell. The screen still plays what it holds.
    });
  });
}
