# Dependency upgrades & stack notes

> **Last major bump:** 2026-06 — Next 16, React 19, ESLint 9 flat config.

## Current core stack

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.x | App Router; async `params` / `searchParams` |
| React | 19.x | Server Components default |
| TypeScript | 5.9 | TS 6 deferred until Next/eslint ecosystem catches up |
| Tailwind | 3.4 | **Tailwind 4** = separate migration (`@tailwindcss/postcss`) |
| Vitest | 3.x | Vitest 4 when stable with Vite 7 |
| Zod | 3.25 | **Zod 4** deferred — breaking schema API |

## pnpm + Sentry (Next 16)

`.npmrc` hoists `require-in-the-middle` / `import-in-the-middle` for `@sentry/nextjs` + OpenTelemetry under pnpm strict mode. After changing `.npmrc`, run `CI=true pnpm install`.

## Removed unused dependencies

- `@remixicon/react` — no imports
- `lodash-es` / `@types/lodash-es` — no imports
- `date-fns` — no imports
- `workbox-window` — SW uses native `navigator.serviceWorker`
- `standardwebhooks` — bundled via `@polar-sh/sdk/webhooks`
- `@radix-ui/react-slot` — Button is custom, not shadcn Slot

## Not in this repo

- **NestJS** — Cohort is Next.js monolith + Supabase. Nest is not used; enterprise Spring track is roadmap Lg3 (separate repo).

## Deferred upgrades (Phase 0 / v2)

| Item | Why defer |
|------|-----------|
| Tailwind 4 | `@theme` CSS migration + token audit with vault 42 |
| Zod 4 | Survey/profile schemas — batch with IPS wizard |
| TypeScript 6 | Wait for `@types/*` + Next peer alignment |
| Vitest 4 | After CI green on Vitest 3 |
| ESLint 10 | eslint-config-next 16 targets ESLint 9 |

## Node

`engines.node >= 20.9` — align with Vercel default (Node 20/22).
