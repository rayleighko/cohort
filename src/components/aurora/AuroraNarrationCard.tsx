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
 * Cache key is [endpoint, asOfDate, score] — narration re-fetches when macro
 * data day or composite score changes. dedupingInterval 5 min.
 *
 * D25 archive fallback (W5 Wed 2026-05-27): when an `initialArchive` is
 * passed, we seed SWR with that text via fallbackData so first paint shows
 * the most recent stored morning_brief instead of the skeleton. While SWR
 * revalidates in the background, a small timestamp annotation tells the
 * user the brief is yesterday's archive — vault 38 §1.2 transparent
 * staleness signal (CEO Q2 mitigation).
 */
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Card from '@/components/ui/Card';
import type { MacroComposite } from '@/lib/macro/composite';
import type { LatestNarration } from '@/lib/aurora/get-latest-narration';

interface Props {
  composite: MacroComposite;
  initialArchive?: LatestNarration | null;
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
const NARRATION_REFRESH_MS = 5 * 60 * 1000;
const ARCHIVE_ANNOTATION_KO =
  '오늘의 cohort — 어제 morning brief 표시 중 · 새 brief 준비 중…';

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

function ArchiveAnnotation() {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="aurora-archive-annotation"
      className="flex items-center gap-2 break-keep text-xs text-cohort-ink-50"
    >
      <span>{ARCHIVE_ANNOTATION_KO}</span>
      <span aria-hidden="true" className="motion-safe:animate-pulse">
        ●
      </span>
    </div>
  );
}

function NarrationBody({
  text,
  showingArchive,
}: {
  text: string;
  showingArchive: boolean;
}) {
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
        shown ? (showingArchive ? 'opacity-90' : 'opacity-100') : 'opacity-0'
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
export function AuroraNarrationBody({ composite, initialArchive }: Props) {
  const archiveFallback: NarrationResponse | undefined = initialArchive
    ? {
        character: 'aurora',
        text: initialArchive.text,
        triggered: false,
        zone: initialArchive.zone,
      }
    : undefined;

  const { data, error, isLoading, isValidating } = useSWR<NarrationResponse, NarrationError>(
    [
      '/api/aurora/narration',
      composite.asOfDate,
      composite.score.toFixed(2),
    ],
    () => fetchNarration(composite),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: NARRATION_REFRESH_MS,
      shouldRetryOnError: false,
      fallbackData: archiveFallback,
      revalidateOnMount: true,
    },
  );

  const fallbackText = error?.serverText ?? FALLBACK_KO;

  // Archive showing iff we seeded with archive AND SWR has not yet swapped
  // in a fresh response. SWR returns fallbackData as `data` during the
  // initial revalidation window — compare against the archive text to
  // detect whether the live fetch has completed.
  const showingArchive = Boolean(
    archiveFallback &&
      initialArchive?.asOfDate === composite.asOfDate &&
      data &&
      data.text === archiveFallback.text &&
      isValidating,
  );

  if (isLoading && !archiveFallback) {
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
  return (
    <div className="flex flex-col gap-2">
      {showingArchive ? <ArchiveAnnotation /> : null}
      <NarrationBody
        key={data.text}
        text={data.text}
        showingArchive={showingArchive}
      />
    </div>
  );
}

/**
 * AuroraNarrationCard — standalone Card-wrapped narration (legacy/standalone
 * surfaces). W3 Mon Day 1 polish — Notion callout block aesthetic. Previous
 * left-border accent (border-l-4 border-l-aurora-calm) retired per 사장님
 * "카드 좌측 보더" complaint. Aurora signal now lives in (a) subtle
 * aurora-tinted background, (b) explicit 🕊 + name label, (c)
 * shadow-mascot-aurora glow (tokenized in tailwind.config.ts).
 */
export default function AuroraNarrationCard({
  composite,
  initialArchive,
}: Props) {
  return (
    <Card className="bg-aurora-calm/[0.04] shadow-mascot-aurora">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-aurora-calm">
          <span aria-hidden="true">🕊</span> Aurora morning brief
        </p>
        <AuroraNarrationBody
          composite={composite}
          initialArchive={initialArchive}
        />
      </div>
    </Card>
  );
}
