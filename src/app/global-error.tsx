'use client';

/**
 * Global error boundary — App Router required pattern for
 * Sentry React render error capture (Sentry 8.0+ recommendation).
 *
 * Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router
 *
 * NOTE: Only triggers in production (Next.js dev mode shows the error
 * overlay instead). Sentry.captureException is a no-op if SENTRY_DSN is
 * not set in env — sentry.client.config.ts handles the init.
 *
 * Renders a Cohort-branded minimal fallback (vault 38/42 token compliant).
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: '#F8F4ED',
          color: '#1A1A1A',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <main
          style={{
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '0.875rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#A8243F',
              margin: '0 0 0.5rem',
              fontWeight: 500,
            }}
          >
            Cohort
          </p>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 500,
              margin: '0 0 1rem',
              wordBreak: 'keep-all',
            }}
          >
            잠시 자리를 비웠습니다
          </h1>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#1A1A1A',
              opacity: 0.7,
              margin: '0 0 1.5rem',
              wordBreak: 'keep-all',
            }}
          >
            잠시 후 다시 시도해주세요. 문제가 계속되면 페이지를 새로 고침해주세요.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
                fontSize: '0.75rem',
                color: '#1A1A1A',
                opacity: 0.4,
                margin: 0,
              }}
            >
              ref: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
