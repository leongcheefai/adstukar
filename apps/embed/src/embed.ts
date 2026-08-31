import { mount, mountAll } from "./mount";

// SPAs that add slots after load call `window.AdsTukar.mountAll()` (or `mount(el, opts)`).
window.AdsTukar = { mount, mountAll };

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountAll(), { once: true });
} else {
  mountAll();
}
