'use client';

/**
 * Aurora 🕊 morning-brief narration card — Client component (SWR).
 *
 * /dashboard first-paints immediately with the macro composite RSC-fetched.
 * This card POSTs the composite to /api/aurora/narration and renders:
 *   loading  → skeleton (motion-reduce respects)
 *   success  → narration text fades in
 *   triggered → COHORT_FALLBACK_REDIRECT text, no alarming visual signal
 *   error    → calm Korean fallback
 *
 * Cache key is [endpoint, composite.computedAt] — narration re-fetches
 * only when /api/macro ISR refreshes a new snapshot. dedupingInterval
 * matches the macro ISR window (1h).
 */
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Card from '@/components/ui/Card';
import type { MacroComposite } from '@/lib/macro/composite';

interface Props {
  composite: MacroComposite;
}

interface NarrationResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  zone: MacroComposite['zone'];
}

interface NarrationError extends Error {
  /** Korean fallback text surfaced by the server (503 narration_unavailable). */
  serverText?: string;
}

const FALLBACK_KO = '[Aurora가 morning brief를 준비 중입니다]';
const HOUR_MS = 3_600_000;

async function fetchNarration(
  composite: MacroComposite,
): Promise<NarrationResponse> {
  const res = await fetch('/api/aurora/narration', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ composite }),
  });
  if (!res.ok) {
    const err = new Error(`narration_http_${res.status}`) as NarrationError;
    // Server crafts a Korean fallback `text` field on 503 — surface it to the
    // user instead of the generic loading-state copy.
    try {
      const body = (await res.json()) as { text?: string };
      if (typeof body.text === 'string' && body.text.length > 0) {
        err.serverText = body.text;
      }
    } catch {
      // Body wasn't JSON — keep generic fallback.
    }
    throw err;
  }
  return (await res.json()) as NarrationResponse;
}

function SkeletonRow({ widthClass }: { widthClass: string }) {
  return (
    <div
      className={`h-3 rounded-full bg-cohort-ink-10 motion-safe:animate-pulse ${widthClass}`}
    />
  );
}

function NarrationSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Aurora morning brief 생성 중"
      className="flex flex-col gap-2 py-1"
    >
      <SkeletonRow widthClass="w-11/12" />
      <SkeletonRow widthClass="w-10/12" />
      <SkeletonRow widthClass="w-7/12" />
      <span className="sr-only break-keep">
        Aurora가 오늘의 morning brief를 준비 중입니다.
      </span>
    </div>
  );
}

function NarrationBody({ text }: { text: string }) {
  // Drives the opacity-0 → opacity-100 fade-in on first paint of the
  // resolved narration. motion-reduce:transition-none short-circuits the
  // animation for prefers-reduced-motion users (AD-6).
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [text]);
  return (
    <p
      role="status"
      aria-live="polite"
      className={`break-keep text-cohort-ink-90 transition-opacity duration-slow ease-out motion-reduce:transition-none motion-reduce:opacity-100 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {text}
    </p>
  );
}

/**
 * AuroraNarrationBody — bare narration content (no Card wrapper, no label).
 * Used by dashboard's NarrationBlock (W3 Mon Day 2) which provides its own
 * collapsible <details> shell + summary label. Default export below wraps
 * this body in the standalone Card-styled callout for any consumer that
 * still wants the boxed presentation.
 */
export function AuroraNarrationBody({ composite }: Props) {
  const { data, error, isLoading } = useSWR<NarrationResponse, NarrationError>(
    ['/api/aurora/narration', composite.computedAt],
    () => fetchNarration(composite),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: HOUR_MS,
      shouldRetryOnError: false,
    },
  );

  const fallbackText = error?.serverText ?? FALLBACK_KO;

  if (isLoading) {
    return <NarrationSkeleton />;
  }
  if (error || !data) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="break-keep text-cohort-ink-50"
      >
        {fallbackText}
      </p>
    );
  }
  return <NarrationBody key={data.text} text={data.text} />;
}

/**
 * AuroraNarrationCard — standalone Card-wrapped narration (legacy/standalone
 * surfaces). W3 Mon Day 1 polish — Notion callout block aesthetic. Previous
 * left-border accent (border-l-4 border-l-aurora-calm) retired per 사장님
 * "카드 좌측 보더" complaint. Aurora signal now lives in (a) subtle
 * aurora-tinted background, (b) explicit 🕊 + name label, (c)
 * shadow-mascot-aurora glow (tokenized in tailwind.config.ts).
 */
export default function AuroraNarrationCard({ composite }: Props) {
  return (
    <Card className="bg-aurora-calm/[0.04] shadow-mascot-aurora">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-aurora-calm">
          <span aria-hidden="true">🕊</span> Aurora morning brief
        </p>
        <AuroraNarrationBody composite={composite} />
      </div>
    </Card>
  );
}
