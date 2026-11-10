// Offline support: build assets are cached on first use, and pages are served from the network
// when possible, falling back to the last cached copy when offline.
const STATIC_CACHE = "static-v1";
const PAGES_CACHE = "pages-v1";
const CACHES = [STATIC_CACHE, PAGES_CACHE];
const MAX_STATIC_ENTRIES = 500;
const MAX_PAGE_ENTRIES = 200;
// On a flaky connection, don't make the user wait long before showing the cached copy
const NETWORK_TIMEOUT_MS = 5000;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => !CACHES.includes(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) {
    return;
  }
  const url = new URL(request.url);

  // Build assets have content hashes in their names and may come from the CDN (assetPrefix)
  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) {
    return cached;
  }

  if (new URL(request.url).origin === self.location.origin) {
    const response = await fetch(request);
    if (response.ok) {
      await putAndTrim(cache, request, response.clone(), MAX_STATIC_ENTRIES);
    }
    return response;
  }

  // Script/style tags load cross-origin assets as opaque responses, which can't be checked for
  // success, so fetch a readable copy with CORS instead (uncached if the CDN doesn't allow it).
  try {
    const response = await fetch(request.url, { mode: "cors", credentials: "omit" });
    if (response.ok) {
      await putAndTrim(cache, request, response.clone(), MAX_STATIC_ENTRIES);
    }
    return response;
  } catch {
    return fetch(request);
  }
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);

  const network = fetch(request).then(async (response) => {
    // Redirected responses can't be replayed for navigations
    if (response.ok && !response.redirected) {
      await putAndTrim(cache, request, response.clone(), MAX_PAGE_ENTRIES);
    }
    return response;
  });
  // If the cached copy is served first, a later network failure is expected
  network.catch(() => {});

  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    const response = await Promise.race([network, timeout]);
    if (response) {
      return response;
    }
    // Timed out: use the cached copy if there is one, otherwise keep waiting
    return (await matchCached(cache, request)) ?? (await network);
  } catch (error) {
    const cached = await matchCached(cache, request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function matchCached(cache, request) {
  return (await cache.match(request)) ?? (await cache.match(request, { ignoreSearch: true }));
}

async function putAndTrim(cache, request, response, maxEntries) {
  await cache.put(request, response);
  const keys = await cache.keys();
  // Keys are in insertion order, so the oldest go first
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}

self.addEventListener("push", function (event) {
  const data = event.data?.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url },
  });
});

// Handles clicking on a url within a notification
self.addEventListener("notificationclick", (event) => {
  const notificationData = event.notification.data;

  if (notificationData.url) {
    clients.openWindow(notificationData.url);
  }

  event.notification.close();
});
