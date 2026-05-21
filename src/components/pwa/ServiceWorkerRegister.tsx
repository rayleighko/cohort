'use client';

import { useEffect } from 'react';

/**
 * Registers the Cohort service worker on mount (client-only).
 * Rendered once in the root layout. Caching strategy lands in W2.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = () => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .catch((err) => {
          // Non-fatal: PWA shell still works without the SW.
          console.warn('[Cohort] service worker registration failed', err);
        });
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
