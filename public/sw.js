const CACHE_NAME = "anota-shell-v1";
const OFFLINE_URL = "/offline.html";

async function cacheAppShell(response) {
  if (!response.ok || response.redirected || new URL(response.url).pathname !== "/") return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put("/", response.clone());
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith("/_next/static/") && /\.(?:js|css)(?:\?|$)/.test(path));
  await Promise.all(assets.map(async (path) => {
    try {
      const request = new Request(new URL(path, self.location.origin), { credentials: "same-origin" });
      if (await cache.match(request)) return;
      const assetResponse = await fetch(request);
      if (assetResponse.ok && assetResponse.type === "basic") await cache.put(request, assetResponse);
    } catch {
      // A failed optional asset should not invalidate the cached app shell.
    }
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      OFFLINE_URL,
      "/manifest.webmanifest",
      "/icon.svg",
      "/icon-192.png",
      "/icon-512.png",
    ])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("anota-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_APP_SHELL") return;
  event.waitUntil((async () => {
    try {
      const response = await fetch("/", { credentials: "same-origin" });
      if (response.type === "basic") await cacheAppShell(response);
    } catch {
      // Keep the previously cached shell; offline mode must not fail the app.
    }
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (url.pathname === "/" && response.type === "basic") await cacheAppShell(response);
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (url.pathname === "/" ? await cache.match("/") : await cache.match(request))
          || (await cache.match(OFFLINE_URL));
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
