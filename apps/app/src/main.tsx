import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

document.documentElement.classList.remove("dark");
import "@repo/ui/styles";
import "@repo/ui/styles/theme-dashboard";
import { Toaster } from "@repo/ui";
import { queryClient } from "./lib/query";
import { Router } from "./router";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
