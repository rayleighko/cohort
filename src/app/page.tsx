'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MascotAvatar from '@/components/mascot/MascotAvatar';
import { posthog } from '@/lib/analytics/posthog';
import { COHORT_EVENTS } from '@/lib/analytics/events';
import { getAbVariant } from '@/lib/analytics/ab';

/**
 * Landing — Version C (production funnel).
 *
 * Public CTA → /signup (Tier 0 free). Waitlist retired from landing.
 *
 * Tokens sourced (per cohort-token-keeper):
 * - Colors: text-cohort-ink-90/70/50, bg-cohort-ivory, bg-white, bg-cohort-primary
 *   (42 §6.2 ink scale + §2.1 brand)
 * - Type: text-3xl→5xl mobile-first ramp, text-base/lg/sm (42 §6.2 scale)
 * - Shadow: shadow-mascot-aurora (42 §6.2 — CTA glow)
 * - Transition: duration-fast/slow + ease-out (42 §6.2)
 * Mobile-first: default = mobile, sm:/lg: enhance. Korean body: break-keep.
 * Microinteraction: scroll-fade (#8) + mount fade-in (#1), motion-reduce fallbacks.
 * Copy: Option B strict (cohort-ux-copy) — Set A hero + Set D duality (38 §4).
 */

/** Scroll-fade reveal wrapper (microinteraction pattern #8). */
function Reveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-in-view={inView}
      className={`translate-y-4 opacity-0 transition duration-slow ease-out data-[in-view=true]:translate-y-0 data-[in-view=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}

const VALUE_PROPS = [
  {
    label: '정보',
    title: '한국·미국 매크로를 한 화면에',
    body: '금리·환율·VIX를 매일 같이 정리합니다. 새벽 뉴욕 시장을 본인 혼자 좇지 않아도 돼요.',
  },
  {
    label: '도구',
    title: '본인 계획 그대로, 분할매수 페이스',
    body: '종합 점수로 본인이 정한 분할매수 단계를 같이 점검합니다. 계획은 늘 본인의 것.',
  },
  {
    label: '의사결정 지원',
    title: '본인이 정한 신호, 시장이 닿을 때',
    body: '본인이 설정한 신호 임계에 시장이 닿으면 알려드려요. 결정은 늘 본인의 몫입니다.',
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // landing_view — anonymous; ab_variant from cookie, no PII.
    posthog.capture(COHORT_EVENTS.LANDING_VIEW, {
      ab_variant: getAbVariant(),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }, []);

  function handleCtaClick() {
    posthog.capture(COHORT_EVENTS.CTA_CLICK, {
      cta_label: '무료로 시작하기',
      cta_destination: '/signup',
      ab_variant: getAbVariant(),
    });
    posthog.capture(COHORT_EVENTS.SIGNUP_START, {
      entry_surface: 'landing_cta',
      ab_variant: getAbVariant(),
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col break-keep bg-cohort-ivory px-6 pb-32 md:pb-36">
      {/* Brand mark */}
      <header className="flex items-center gap-2 pt-12">
        <MascotAvatar character="aurora" state="calm" size={36} />
        <MascotAvatar character="vesper" state="calm" size={36} />
        <span className="text-lg font-bold tracking-tight text-cohort-primary">
          Cohort
        </span>
      </header>

      {/* Hero — Set A (38-brief §4) */}
      <section
        className={`mt-14 transition-opacity duration-slow ease-out motion-reduce:transition-none ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="break-keep text-3xl font-medium text-cohort-ink-90 sm:text-4xl lg:text-5xl">
          본인 계획과 코호트 — 흔들리지 않는 페이스.
        </h1>
        <p className="mt-4 break-keep text-base text-cohort-ink-70 sm:text-lg">
          별도 학습 없이, 하루 1분. 본인 계획·페이스에만 집중.
        </p>
      </section>

      {/* 석류 visual */}
      <Reveal className="mt-16 flex flex-col items-center">
        <Image
          src="/icons/cohort-icon-512.svg"
          alt="석류 — 한 열매 안의 여러 씨앗, cohort의 상징"
          width={112}
          height={112}
          priority={false}
        />
        <p className="mt-3 text-center text-sm leading-relaxed text-cohort-ink-70">
          한 열매 안의 여러 씨앗처럼 — 같은 페이스를 걷는 코호트.
        </p>
      </Reveal>

      {/* 3-section value prop */}
      <section className="mt-16 flex flex-col gap-4">
        {VALUE_PROPS.map((v) => (
          <Reveal key={v.label}>
            <article className="rounded-lg bg-white p-5 shadow-sm">
              <span className="text-sm font-semibold text-cohort-primary">
                {v.label}
              </span>
              <h2 className="mt-1 text-lg font-bold text-cohort-ink-90">
                {v.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-cohort-ink-70">
                {v.body}
              </p>
            </article>
          </Reveal>
        ))}
      </section>

      {/* Mascot duality — Set D (38-brief §4) */}
      <Reveal className="mt-16">
        <h2 className="text-xl font-bold text-cohort-ink-90">
          Aurora 🕊가 새벽을 정리하고,
          <br />
          Vesper 🦅가 결정을 봅니다.
        </h2>
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <MascotAvatar character="aurora" state="calm" size={44} />
            <p className="text-base leading-relaxed text-cohort-ink-70">
              <span className="font-semibold text-cohort-ink-90">Aurora</span>{' '}
              — 차분한 동행. 매일 아침 매크로를 같이 정리하고, 본인 계획 페이스를
              같이 호흡합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <MascotAvatar character="vesper" state="calm" size={44} />
            <p className="text-base leading-relaxed text-cohort-ink-70">
              <span className="font-semibold text-cohort-ink-90">Vesper</span>{' '}
              — 또렷한 신호. 본인이 정한 조건이 발동하면 가장 먼저
              알려드립니다.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Tier preview — support framing, no feature comparison table */}
      <Reveal className="mt-16">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-base leading-relaxed text-cohort-ink-70 break-keep">
            <span className="font-semibold text-cohort-ink-90">무료</span> —
            매크로·페이스·행동 가드 도구를 모두 이용할 수 있어요.
          </p>
          <p className="mt-2 text-base leading-relaxed text-cohort-ink-70 break-keep">
            <span className="font-semibold text-cohort-ink-90">프로 · 프리미엄</span>{' '}
            — 설정에서 선택하는 후원(기능 차등 없음). 개인 학습 프로젝트
            운영을 돕고 싶을 때만.
          </p>
        </div>
      </Reveal>

      {/* Inline-flow spacer — reserves vertical space equal to the fixed
          CTA so Footer (root layout sibling) is not occluded. Matches the
          BottomNav spacer pattern (Hotfix #3, 2026-05-27). */}
      <div aria-hidden="true" className="h-28 md:h-32" />

      {/* Bottom-fixed CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-cohort-ink-10 bg-cohort-ivory/95 px-6 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          <Link
            href="/signup"
            onClick={handleCtaClick}
            className="flex min-h-[52px] w-full items-center justify-center rounded-lg bg-cohort-primary px-5 text-base font-semibold text-cohort-ivory shadow-mascot-aurora transition-colors duration-fast ease-out hover:bg-aurora-alert active:bg-aurora-concerned focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cohort-primary"
          >
            무료로 시작하기
          </Link>
          <p className="text-center text-sm text-cohort-ink-50">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="font-medium text-cohort-primary underline-offset-2 hover:underline"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
