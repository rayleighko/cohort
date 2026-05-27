import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-cohort-ink-10 bg-cohort-ivory pb-20 md:pb-24"
      aria-label="사이트 푸터"
    >
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="text-xl font-semibold text-cohort-primary">Cohort</div>
            <p className="mt-2 break-keep text-sm text-cohort-ink-50">
              지수 종목·매크로를 같은 페이스로 동행하는 cohort.
            </p>
          </div>

          <nav
            className="grid grid-cols-3 gap-4 text-sm"
            aria-label="푸터 네비게이션"
          >
            <div>
              <h3 className="mb-2 font-medium text-cohort-ink-90">서비스</h3>
              <ul className="space-y-1.5 text-cohort-ink-70">
                <li>
                  <Link
                    href="/dashboard"
                    className="transition-colors hover:text-cohort-primary"
                  >
                    대시보드
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chat"
                    className="transition-colors hover:text-cohort-primary"
                  >
                    Aurora 채팅
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-cohort-ink-90">회사</h3>
              <ul className="space-y-1.5 text-cohort-ink-70">
                <li>
                  <Link
                    href="/about"
                    className="transition-colors hover:text-cohort-primary"
                  >
                    소개
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@cohort.co.kr"
                    className="transition-colors hover:text-cohort-primary"
                  >
                    문의
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-cohort-ink-90">법적 고지</h3>
              <ul className="space-y-1.5 text-cohort-ink-70">
                <li>
                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-cohort-primary"
                  >
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="transition-colors hover:text-cohort-primary"
                  >
                    이용약관
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Option B disclaimer (vault 38 §1.2 Strategic Decision 0) */}
        <div className="mt-8 break-keep border-t border-cohort-ink-10 pt-6 text-xs text-cohort-ink-50">
          본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문 서비스가 아닙니다. 모든 투자 결정과 손익은 사용자 본인의 책임입니다.
        </div>

        <div className="mt-6 break-keep text-xs text-cohort-ink-50">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              상호명:{' '}
              <strong className="font-medium text-cohort-ink-70">플랜사이</strong>
            </span>
            <span>
              사업자등록번호:{' '}
              <strong className="font-medium text-cohort-ink-70">
                157-04-02001
              </strong>
            </span>
            <span>
              통신판매업신고번호:{' '}
              <strong className="font-medium text-cohort-ink-70">
                2022-영등포-0450
              </strong>
            </span>
            <span>
              대표자:{' '}
              <strong className="font-medium text-cohort-ink-70">조윤환</strong>
            </span>
            <span className="basis-full md:basis-auto">
              사업장:{' '}
              <strong className="font-medium text-cohort-ink-70">
                서울특별시 종로구 대학로 12길 61, 5층 501-87호
              </strong>
            </span>
            <span>
              유선번호:{' '}
              <strong className="font-medium text-cohort-ink-70">
                010-4151-6626
              </strong>
            </span>
            <span>
              이메일:{' '}
              <strong className="font-medium text-cohort-ink-70">
                contact@cohort.co.kr
              </strong>
            </span>
          </div>
          <div className="mt-4 text-cohort-ink-30">
            © 2026 플랜사이. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
