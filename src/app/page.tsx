import MascotAvatar from '@/components/mascot/MascotAvatar';
import Disclaimer from '@/components/ui/Disclaimer';

/**
 * Landing page — Day 1 skeleton.
 * Full Landing Version C copy lands Day 5 (per 17-pre-launch-landing-page-sketch
 * §13, with brand mapping applied). Mobile-first: vertical stack + bottom-fixed CTA.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-28 pt-16">
      {/* Brand mark — dual mascot */}
      <div className="flex items-center gap-3">
        <MascotAvatar character="aurora" state="calm" size={48} />
        <MascotAvatar character="vesper" state="calm" size={48} />
        <span className="text-lg font-bold tracking-tight text-cohort-primary">
          Cohort
        </span>
      </div>

      {/* Hero */}
      <section className="mt-14 flex flex-1 flex-col">
        <h1 className="text-3xl font-extrabold leading-snug text-cohort-charcoal sm:text-4xl">
          본인 plan과 cohort.
          <br />
          흔들리지 않는 페이스.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-cohort-charcoal/70">
          Top 5-10% sophisticated retail을 위한 투자 페이스 메이트 — Aurora 🕊와
          Vesper 🦅의 동행.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-cohort-charcoal/55">
          새벽 뉴욕 시장을 같이 읽고, 분할매수 페이스를 같이 점검하고, 뇌동매매를
          같이 호흡합니다. 정보 + 도구 + 의사결정 지원.
        </p>
      </section>

      {/* Bottom-fixed CTA bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-cohort-charcoal/10 bg-cohort-ivory/95 px-6 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            className="min-h-[52px] w-full rounded-xl bg-cohort-primary px-5 text-base font-semibold text-cohort-ivory"
          >
            Cohort 시작하기 (무료)
          </button>
          <div className="mt-2">
            <Disclaimer />
          </div>
        </div>
      </div>
    </main>
  );
}
