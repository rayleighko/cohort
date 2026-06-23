'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { initPostHog, posthog } from '@/lib/analytics/posthog';
import { COHORT_EVENTS } from '@/lib/analytics/events';

/**
 * Bearings — /regime EN landing (USD market validation).
 *
 * Direction: "precision instrument / engineering" tone. Near-black ground,
 * a single accent (#A8243F = cohort-primary), monospace data labels, a 2×2
 * regime matrix (inflation × growth) as the hero instrument. No gradients,
 * no emoji spray, no mascot character names yet — the brand line stands in
 * for the dove/hawk duality.
 *
 * Positioning (Option B, unchanged): information + tool + education only.
 * No recommendations, no allocation %, no buy/sell calls.
 *
 * Copy: verbatim from the launch brief (PART 3) — do not paraphrase.
 * Lead capture: reuses POST /api/waitlist with source='regime-landing'.
 * PostHog: regime_landing_view (mount) + regime_waitlist_submit (success);
 * the server additionally fires the unified waitlist_submit. Email is sent to
 * the DB only, never to PostHog.
 */

const ACCENT = '#A8243F'; // cohort-primary (pomegranate)
const HAWK = '#E8A33D'; // cohort-amber

type FormState = 'idle' | 'submitting' | 'subscribed' | 'already' | 'error';

const TRUST = [
  'No login',
  'No brokerage linking',
  'Your portfolio never leaves your screen',
];

/** Hero instrument — 2×2 economic regime matrix (inflation × growth). */
function RegimeMatrix() {
  return (
    <svg
      viewBox="0 0 320 320"
      role="img"
      aria-label="A 2×2 economic regime matrix. Horizontal axis: inflation, low to high. Vertical axis: growth, low to high. The four quadrants are recovery, overheat, deflation, and stagflation. A dovish read sits in the low-inflation half; a hawkish read sits in the high-inflation half."
      className="mx-auto h-auto w-full max-w-[360px]"
    >
      {/* registration ticks (instrument corners) */}
      {[
        [10, 10, 26, 10],
        [10, 10, 10, 26],
        [310, 10, 294, 10],
        [310, 10, 310, 26],
        [10, 310, 26, 310],
        [10, 310, 10, 294],
        [310, 310, 294, 310],
        [310, 310, 310, 294],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#3a3a3d"
          strokeWidth="1"
        />
      ))}

      {/* grid frame */}
      <rect
        x="40"
        y="40"
        width="240"
        height="240"
        fill="none"
        stroke="#2a2a2d"
        strokeWidth="1"
      />

      {/* fine tick marks along the frame */}
      {Array.from({ length: 11 }).map((_, i) => {
        const p = 40 + i * 24;
        return (
          <g key={`t-${i}`} stroke="#2a2a2d" strokeWidth="1">
            <line x1={p} y1="276" x2={p} y2="280" />
            <line x1="40" y1={p} x2="44" y2={p} />
          </g>
        );
      })}

      {/* center crosshair */}
      <line x1="160" y1="40" x2="160" y2="280" stroke="#3a3a3d" strokeWidth="1" />
      <line x1="40" y1="160" x2="280" y2="160" stroke="#3a3a3d" strokeWidth="1" />

      {/* quadrant labels (mono) */}
      <g
        fill="#8a8a8f"
        fontFamily="'Berkeley Mono','JetBrains Mono',monospace"
        fontSize="9"
        letterSpacing="0.08em"
      >
        <text x="100" y="84" textAnchor="middle">RECOVERY</text>
        <text x="220" y="84" textAnchor="middle">OVERHEAT</text>
        <text x="100" y="240" textAnchor="middle">DEFLATION</text>
        <text x="220" y="240" textAnchor="middle">STAGFLATION</text>
      </g>

      {/* dovish marker — low-inflation half (circle, accent) */}
      <g>
        <circle cx="100" cy="120" r="5" fill={ACCENT} />
        <circle cx="100" cy="120" r="11" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.5" />
        <text
          x="100"
          y="146"
          textAnchor="middle"
          fill={ACCENT}
          fontFamily="'Berkeley Mono','JetBrains Mono',monospace"
          fontSize="9"
          letterSpacing="0.1em"
        >
          DOVISH
        </text>
      </g>

      {/* hawkish marker — high-inflation half (diamond, amber) */}
      <g>
        <rect x="214" y="114" width="10" height="10" transform="rotate(45 219 119)" fill={HAWK} />
        <text
          x="219"
          y="146"
          textAnchor="middle"
          fill={HAWK}
          fontFamily="'Berkeley Mono','JetBrains Mono',monospace"
          fontSize="9"
          letterSpacing="0.1em"
        >
          HAWKISH
        </text>
      </g>

      {/* axis labels (mono) */}
      <g
        fill="#aeaeb2"
        fontFamily="'Berkeley Mono','JetBrains Mono',monospace"
        fontSize="10"
        letterSpacing="0.12em"
      >
        <text x="160" y="302" textAnchor="middle">INFLATION →</text>
        <text
          x="20"
          y="160"
          textAnchor="middle"
          transform="rotate(-90 20 160)"
        >
          GROWTH →
        </text>
      </g>
    </svg>
  );
}

export default function RegimePage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Standalone EN surface — set the document language for AT/screen readers,
  // restore on unmount (the rest of the app is ko).
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = 'en';
    // The root PostHogProvider calls initPostHog() in its own mount effect, but
    // React runs child effects before parent effects — so on a cold/direct load
    // this page's effect fires BEFORE init runs, and posthog-js silently drops a
    // capture() made before init(). That would lose regime_landing_view (the
    // top-of-funnel metric) for exactly the direct-hit traffic a landing page
    // gets. initPostHog() is idempotent (guarded), so calling it here guarantees
    // init precedes the capture without risking a double init.
    initPostHog();
    posthog.capture(COHORT_EVENTS.REGIME_LANDING_VIEW, {
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
    return () => {
      document.documentElement.lang = prev;
    };
  }, []);

  const canSubmit = email.trim().length > 0 && state !== 'submitting';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setState('submitting');
    setErrorMsg(null);

    let distinctId: string | undefined;
    try {
      distinctId = posthog.get_distinct_id();
    } catch {
      distinctId = undefined;
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          consent_pipa: true,
          consent_marketing: false,
          source: 'regime-landing',
          distinct_id: distinctId,
        }),
      });
      const data = await res.json();

      if (res.ok && data.message === 'subscribed') {
        posthog.capture(COHORT_EVENTS.REGIME_WAITLIST_SUBMIT, {
          source: 'regime-landing',
        });
        setState('subscribed');
      } else if (res.ok && data.message === 'already_subscribed') {
        setState('already');
      } else if (res.status === 400) {
        setState('error');
        setErrorMsg('That email doesn’t look right. Try name@email.com.');
      } else {
        setState('error');
        setErrorMsg('Something went wrong on our end. Try again in a moment.');
      }
    } catch {
      setState('error');
      setErrorMsg('Connection hiccup. Try again in a moment.');
    }
  }

  const done = state === 'subscribed' || state === 'already';

  return (
    <main className="min-h-screen break-words bg-neutral-950 font-sans text-neutral-200 antialiased">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 pb-16 pt-8 sm:px-8">
        {/* wordmark */}
        <header className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: ACCENT }}
          />
          <span className="font-mono text-sm font-semibold tracking-[0.32em] text-neutral-100">
            BEARINGS
          </span>
        </header>

        {/* hero */}
        <section className="mt-14">
          <p className="font-mono text-xs tracking-[0.18em] text-neutral-500">
            REGIME READ
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-neutral-50 sm:text-4xl">
            Which economic regime is your portfolio secretly betting on?
          </h1>
          <p className="mt-5 text-base leading-relaxed text-neutral-400 sm:text-lg">
            Every portfolio is a forecast. Most people never read theirs.
            Bearings reads it for you — which regime you’re long, and which one
            quietly breaks you.
          </p>
        </section>

        {/* hero instrument */}
        <section className="mt-12 flex justify-center">
          <div className="w-full rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 sm:p-7">
            <RegimeMatrix />
          </div>
        </section>

        {/* trust block */}
        <section className="mt-10" aria-label="Privacy guarantees">
          <ul className="flex flex-wrap gap-2">
            {TRUST.map((t) => (
              <li
                key={t}
                className="rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 font-mono text-xs tracking-wide text-neutral-300"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* methodology */}
        <section className="mt-10 border-l-2 pl-4" style={{ borderColor: ACCENT }}>
          <p className="text-sm leading-relaxed text-neutral-400">
            We backtest against real regime shifts — 2008’s growth scare, 2022’s
            inflation shock — and show you the drawdowns, not just the highlight
            reel.
          </p>
        </section>

        {/* brand line */}
        <section className="mt-8">
          <p className="font-mono text-xs tracking-[0.14em] text-neutral-500">
            Two winds, always — the dovish read and the hawkish read.
          </p>
        </section>

        {/* lead capture */}
        <section className="mt-12">
          {done ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5"
            >
              <p className="font-mono text-xs tracking-[0.14em]" style={{ color: ACCENT }}>
                {state === 'already' ? 'ALREADY ON THE LIST' : 'CONFIRMED'}
              </p>
              <p className="mt-3 text-base leading-relaxed text-neutral-200">
                You’re on the list. We’ll send your first regime read the moment
                it’s ready — no spam, no calls, ever.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="regime-email" className="sr-only">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="regime-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[52px] w-full flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 font-mono text-base text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  style={{ caretColor: ACCENT }}
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-busy={state === 'submitting'}
                  className="min-h-[52px] shrink-0 rounded-lg px-6 text-base font-semibold text-neutral-50 transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50 sm:w-auto"
                  style={{ backgroundColor: ACCENT }}
                >
                  {state === 'submitting' ? 'Reading…' : 'Read my regime'}
                </button>
              </div>
              {errorMsg && (
                <p
                  role="alert"
                  className="mt-3 font-mono text-xs"
                  style={{ color: HAWK }}
                >
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </section>

        {/* disclaimer footer */}
        <footer className="mt-auto pt-16">
          <p className="text-xs leading-relaxed text-neutral-500">
            Bearings is an educational tool, not investment advice. No
            recommendations, no buy/sell calls, no “correct” allocation — just a
            clearer read on what you already hold.
          </p>
          <p className="mt-4 font-mono text-[11px] tracking-wider text-neutral-600">
            © 2026 Bearings · www.thebearings.app
          </p>
        </footer>
      </div>
    </main>
  );
}
