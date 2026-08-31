import type { mount, mountAll } from "./mount";

declare global {
  /** API origin injected by Vite `define` at build time (see vite.config.ts). */
  const __ADSTUKAR_API__: string;

  interface Window {
    AdsTukar?: {
      mount: typeof mount;
      mountAll: typeof mountAll;
    };
  }
}

export type {};
