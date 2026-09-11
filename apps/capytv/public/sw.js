// The offline shell. CapyTV is a screen on somebody else's wifi, so a reload
// during a network drop must still come back to a clock rather than a browser
// error page.
//
// Network first, cache as a fallback: a deployed change reaches a screen on its
// next reload, and a screen with no network still starts.

const CACHE = "capytv-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/icon.svg"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache the API. A stale batch would be plays the server has already
  // voided, and a cached report would be a play counted twice.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        void caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit ?? caches.match("/").then((shell) => shell ?? Response.error())),
      ),
  );
});
