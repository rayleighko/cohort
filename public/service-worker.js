/*
 * Cohort service worker — unified caching + push handler.
 * Scope: install/activate lifecycle + push notification routing.
 * TODO(W2+): cache-first static assets, network-first API, stale-while-revalidate
 * dashboard, offline fallback (per 14-arch §14.2).
 *
 * W5 Mon: push + notificationclick event listeners merged from former /sw.js
 * (W4 Fri) — browsers allow only one active SW per scope. Caching strategy
 * placeholders preserved verbatim.
 *
 * Coordinated with src/lib/notification/providers/web-push.ts payload shape:
 *   { title, body, data: { category, deep_link, trigger_id, behavioral_event_id } }
 */

const CACHE_VERSION = 'cohort-v1';

self.addEventListener('install', () => {
  // Activate this worker immediately on first install.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim open clients so the worker controls pages without a reload.
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler — placeholder until caching strategy lands in W2.
self.addEventListener('fetch', () => {
  // intentionally no-op for Day 1
});

// Push notification handler (merged from /sw.js W4 Fri).
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'Cohort', body: event.data.text() };
  }

  const title = payload.title || 'Cohort';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: payload.data || {},
    tag: (payload.data && payload.data.category) || 'cohort',
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink =
    (event.notification.data && event.notification.data.deep_link) || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            if ('navigate' in client) {
              try {
                client.navigate(deepLink);
              } catch (err) {
                // ignore navigation errors
              }
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(deepLink);
        }
      }),
  );
});
