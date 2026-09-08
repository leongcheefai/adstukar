import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // `parseFeed` reads an RSS body with `DOMParser`, which only a DOM has. The
    // rest of the suite is pure and does not care either way.
    environment: "jsdom",
  },
});
