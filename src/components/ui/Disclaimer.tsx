/**
 * 자본시장법 disclaimer — required on every user-facing surface (14-arch §14.4-pre).
 * `compact` = truncated form for push/alerts; default = standard footer form.
 * Strategic Decision 0 = Option B: Cohort is a decision-support tool, NOT an advisor.
 */

const STANDARD =
  '본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문 서비스가 아닙니다. 모든 투자 결정과 손익은 사용자 본인의 책임입니다.';
const COMPACT = '투자 자문 X. 모든 결정은 본인 책임.';

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className="text-xs leading-relaxed text-cohort-charcoal/55">
      {compact ? COMPACT : STANDARD}
    </p>
  );
}

/** Layout-slot footer variant — pins the standard disclaimer at page bottom. */
export function DisclaimerFooter() {
  return (
    <footer className="mt-auto border-t border-cohort-charcoal/10 px-5 py-4">
      <Disclaimer />
    </footer>
  );
}
