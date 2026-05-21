/**
 * Next.js instrumentation hook — loads the Sentry server/edge configs.
 * Sentry stays inert without SENTRY_DSN (placeholder env, Day 1).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
