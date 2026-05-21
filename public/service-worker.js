/*
 * Cohort service worker — Day 1 baseline.
 * Scope: install/activate lifecycle only. No advanced caching yet.
 * TODO(W2+): cache-first static assets, network-first API, stale-while-revalidate
 * dashboard, offline fallback (per 14-arch §14.2). TODO(W4): `push` event handler
 * for Web Push delivery with Aurora/Vesper state-aware notification images.
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
