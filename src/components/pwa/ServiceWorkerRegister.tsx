'use client';

import { useEffect } from 'react';

import { registerServiceWorker } from '@/lib/notification/sw-register';

/**
 * Registers the Cohort service worker on mount (client-only).
 * Rendered once in the root layout. Required for web push + PWA shell.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      registerServiceWorker().catch((err) => {
        // Non-fatal: PWA shell still works without the SW.
        console.warn('[Cohort] service worker registration failed', err);
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
