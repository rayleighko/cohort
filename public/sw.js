/**
 * Cohort PWA Service Worker
 * - Handles incoming web push events
 * - Routes notification click to deep links
 *
 * Coordinated with src/lib/notification/providers/web-push.ts payload shape:
 *   { title, body, data: { category, deep_link, trigger_id, behavioral_event_id } }
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

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
