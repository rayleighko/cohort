import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Cohort',
  description:
    'Cohort 개인정보처리방침 — 플랜사이가 운영하는 Cohort 서비스의 개인정보 수집·처리·파기·이용자 권리 안내.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10 border-b border-cohort-ink-10 pb-6">
        <h1 className="text-3xl font-semibold text-cohort-ink-90 md:text-4xl">
          개인정보처리방침
        </h1>
        <p className="mt-3 break-keep text-sm text-cohort-ink-50">
          시행일자: 2026-06-15 (V1 launch) · 최종 수정: 2026-05-27
        </p>
      </header>

      <article className="break-keep text-base leading-relaxed text-cohort-ink-70">
        <p className="text-sm text-cohort-ink-70">
          플랜사이(이하 &ldquo;회사&rdquo;)는 Cohort 서비스(이하 &ldquo;서비스&rdquo;)
          이용자의 개인정보 보호를 위해 「개인정보 보호법」 및 관련 법령을 준수하며,
          본 처리방침을 통해 개인정보의 처리 방침을 안내합니다.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제1조 (개인정보의 처리 목적)
          </h2>
          <p className="mt-3">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
            개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
            변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등
            필요한 조치를 이행합니다.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-6">
            <li>
              <strong className="text-cohort-ink-90">회원 가입 및 관리</strong>:
              회원 가입 의사 확인, 본인 식별·인증, 회원자격 유지·관리, 부정이용 방지,
              만 14세 이상 확인, 각종 고지·통지.
            </li>
            <li>
              <strong className="text-cohort-ink-90">서비스 제공</strong>:
              매크로 dashboard, 분할매수 의사결정 도구, custom trigger 알림,
              Aurora 🕊 + Vesper 🦅 마스코트 AI 대화, 본인 plan 영역 reference,
              알림 전송.
            </li>
            <li>
              <strong className="text-cohort-ink-90">요금 결제 및 정산</strong>:
              토스페이먼츠를 통한 구독 결제, 환불 처리, 부정 결제 방지.
            </li>
            <li>
              <strong className="text-cohort-ink-90">서비스 개선 및 분석</strong>:
              익명화된 사용 행동 분석, 서비스 품질 개선, 통계학적 분석 (별도 동의 한정).
            </li>
            <li>
              <strong className="text-cohort-ink-90">마케팅 및 광고</strong>:
              신규 서비스 안내, 맞춤 서비스 제공 (별도 동의 한정).
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제2조 (처리하는 개인정보 항목)
          </h2>
          <h3 className="mt-4 text-base font-semibold text-cohort-ink-90">
            필수 항목
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>이메일 주소</li>
            <li>비밀번호 (bcrypt 해시 저장)</li>
            <li>회원 가입 일자</li>
          </ul>

          <h3 className="mt-5 text-base font-semibold text-cohort-ink-90">
            서비스 이용 과정에서 자동 수집되는 항목
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
            <li>디바이스 정보 (OS, 브라우저)</li>
            <li>PWA 설치 여부</li>
          </ul>

          <h3 className="mt-5 text-base font-semibold text-cohort-ink-90">
            별도 동의 후 수집 항목 (선택)
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>투자 경력 분류 (1-2년 / 3-5년 / 6-10년 / 10+년)</li>
            <li>자산 구성 분류 (퍼센트 단위, 종목명·금액 미수집)</li>
            <li>사용 중인 세제 혜택 계좌 종류</li>
            <li>정보 source 사용 패턴, 결제 의향 및 가격 민감도, 직업 분야 분류</li>
            <li>익명화된 Aurora · Vesper 대화 내역</li>
            <li>익명화된 trigger 설정 및 발화 기록</li>
          </ul>

          <p className="mt-5">
            <strong className="text-cohort-ink-90">민감정보</strong>: 회사는 사상·신념,
            정치적 견해, 건강·성생활, 인종·민족, 유전정보, 범죄경력 등 「개인정보 보호법」
            제23조의 민감정보를 수집하지 않습니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제3조 (개인정보의 처리 및 보유 기간)
          </h2>
          <p className="mt-3">
            회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 동의받은
            기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>회원 가입 및 관리: 회원 탈퇴 시까지 (분쟁 발생 시 분쟁 해결 시까지)</li>
            <li>서비스 제공: 회원 탈퇴 시까지</li>
            <li>결제 및 정산: 「전자상거래법」에 따라 5년</li>
            <li>익명화된 사용 행동 분석 데이터: 90일 raw → 이후 익명 집계 영구 보존</li>
            <li>Aurora · Vesper 대화 내역: 회원 탈퇴 시까지 (즉시 삭제 요청 가능)</li>
            <li>마케팅·광고 정보 동의: 동의 철회 시까지</li>
          </ul>
          <p className="mt-4">법령에 따른 별도 보유:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              「전자상거래 등에서의 소비자보호에 관한 법률」: 계약·청약철회 기록 5년 ·
              대금결제 및 재화 공급 기록 5년 · 소비자 불만·분쟁처리 기록 3년
            </li>
            <li>「통신비밀보호법」: 접속 로그 3개월</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제4조 (개인정보의 제3자 제공)
          </h2>
          <p className="mt-3">
            회사는 정보주체의 동의 또는 「개인정보 보호법」 제17조·제18조에 해당하는
            경우에만 개인정보를 제3자에게 제공합니다.
          </p>
          <p className="mt-3">
            <strong className="text-cohort-ink-90">현재 제3자 제공 항목</strong>:
            없음. 회사는 V1 시점 모든 개인정보를 외부 제3자에게 제공하지 않습니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제5조 (개인정보 처리 업무의 위탁)
          </h2>
          <p className="mt-3">
            회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리 업무를
            위탁합니다.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-cohort-ink-10 text-left text-cohort-ink-90">
                  <th className="py-2 pr-4 font-semibold">수탁자</th>
                  <th className="py-2 font-semibold">위탁업무 내용</th>
                </tr>
              </thead>
              <tbody className="text-cohort-ink-70">
                <tr className="border-b border-cohort-ink-05">
                  <td className="py-2 pr-4">Supabase, Inc. (미국)</td>
                  <td className="py-2">데이터베이스 호스팅, 인증, 저장</td>
                </tr>
                <tr className="border-b border-cohort-ink-05">
                  <td className="py-2 pr-4">Vercel, Inc. (미국)</td>
                  <td className="py-2">웹사이트 호스팅</td>
                </tr>
                <tr className="border-b border-cohort-ink-05">
                  <td className="py-2 pr-4">Anthropic, PBC (미국)</td>
                  <td className="py-2">Aurora · Vesper AI 대화 처리 (Claude API)</td>
                </tr>
                <tr className="border-b border-cohort-ink-05">
                  <td className="py-2 pr-4">토스페이먼츠 주식회사 (대한민국)</td>
                  <td className="py-2">결제 처리</td>
                </tr>
                <tr className="border-b border-cohort-ink-05">
                  <td className="py-2 pr-4">Resend, Inc. (미국)</td>
                  <td className="py-2">이메일 발송</td>
                </tr>
                <tr className="border-b border-cohort-ink-05">
                  <td className="py-2 pr-4">PostHog, Inc. (미국)</td>
                  <td className="py-2">익명화된 사용 행동 분석</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    Functional Software, Inc. (Sentry, 미국)
                  </td>
                  <td className="py-2">오류 모니터링</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            위탁계약 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 처리
            금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자 관리·감독, 손해배상 등
            책임에 관한 사항을 계약서에 명시하고 있습니다.
          </p>
          <p className="mt-3">
            <strong className="text-cohort-ink-90">국외이전 안내</strong>: 일부 수탁자가
            미국에 위치하며 개인정보가 미국으로 이전됩니다. 사용자는 「개인정보 보호법」
            제28조의8에 따라 국외이전을 거부할 권리가 있습니다 (거부 시 서비스 이용 제한).
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제6조 (정보주체의 권리·의무 및 그 행사방법)
          </h2>
          <p className="mt-3">
            이용자는 개인정보 주체로서 다음과 같은 권리를 행사할 수 있습니다.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구 (회원 탈퇴 또는 부분 삭제)</li>
            <li>처리 정지 요구</li>
          </ol>
          <p className="mt-4">
            위의 권리 행사는{' '}
            <a
              className="text-cohort-primary underline"
              href="mailto:contact@cohort.co.kr"
            >
              contact@cohort.co.kr
            </a>{' '}
            또는 서비스 내 &ldquo;설정 &gt; 데이터 관리&rdquo; 메뉴를 통하여 하실 수
            있으며, 회사는 이에 대해 지체 없이 조치합니다. 만 14세 미만 아동의
            회원가입은 허용되지 않습니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제7조 (개인정보의 파기)
          </h2>
          <p className="mt-3">
            회사는 개인정보 보유 기간의 경과, 처리목적 달성 등 개인정보가 불필요하게
            되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-cohort-ink-90">파기 절차</strong>: 목적 달성 후
              별도 DB에서 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 또는 즉시
              파기됩니다.
            </li>
            <li>
              <strong className="text-cohort-ink-90">파기 방법</strong>: 전자적 파일은
              재생 불가능한 기술적 방법으로, 종이 출력물은 분쇄 또는 소각합니다.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제8조 (개인정보의 안전성 확보 조치)
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              <strong className="text-cohort-ink-90">관리적 조치</strong>: 내부
              관리계획 수립·시행, 정기적 운영자 자체 인지 및 점검.
            </li>
            <li>
              <strong className="text-cohort-ink-90">기술적 조치</strong>: 접근권한
              관리, 접근통제 시스템, 비밀번호 bcrypt 해시 저장, Supabase Row Level
              Security 및 at-rest 암호화, HTTPS / TLS 1.2+ 전송 암호화.
            </li>
            <li>
              <strong className="text-cohort-ink-90">물리적 조치</strong>: 클라우드
              수탁자 (Supabase / Vercel)의 시설 접근통제에 의존.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제9조 (자동화된 의사결정에 관한 안내)
          </h2>
          <p className="mt-3">
            회사는 Aurora 🕊 + Vesper 🦅 마스코트 AI 대화 서비스 제공을 위해 Anthropic
            Claude API를 활용합니다. 본 AI는 사용자의 대화 내용 + 본인 plan + 매크로
            score를 참조하여 응답을 생성합니다.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Aurora · Vesper AI는 <strong>투자 자문 서비스가 아닙니다</strong>. 일반적인
              투자 교육, 본인 plan reference, 멘탈 관리, 원칙 reinforcement만 제공합니다.
            </li>
            <li>
              &ldquo;지금 매수해야 할까?&rdquo;, &ldquo;비중 X%로 가야 할까?&rdquo;
              같은 구체적 추천 질의에는 자동화된 안전 필터가 활성화되어 본인 plan
              재점검 안내로 redirect됩니다.
            </li>
            <li>최종 투자 결정은 사용자 본인의 책임입니다.</li>
            <li>
              사용자는 마스코트 AI 대화를 거부하고 dashboard만 사용할 수 있으며, 자신의
              대화 내역을 언제든지 조회 및 삭제할 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제10조 (개인정보 보호책임자)
          </h2>
          <p className="mt-3">
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 불만 처리
            및 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정합니다.
          </p>
          <div className="mt-4 rounded-2xl bg-cohort-ink-05 p-5 text-sm">
            <p>
              <strong className="text-cohort-ink-90">개인정보 보호책임자</strong>
            </p>
            <ul className="mt-2 space-y-1">
              <li>성명: 조윤환</li>
              <li>직책: 대표</li>
              <li>
                연락처:{' '}
                <a
                  className="text-cohort-primary underline"
                  href="mailto:contact@cohort.co.kr"
                >
                  contact@cohort.co.kr
                </a>
              </li>
              <li>유선: 010-4151-6626</li>
            </ul>
          </div>
          <p className="mt-4 text-sm">
            개인정보 침해 신고는 한국인터넷진흥원 개인정보 침해신고센터
            (privacy.go.kr · 국번없이 118) 또는 개인정보 분쟁조정위원회 (kopico.go.kr ·
            1833-6972)로 신고하실 수 있습니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제11조 (개인정보 처리방침의 변경)
          </h2>
          <p className="mt-3">
            이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경
            내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터
            공지사항을 통하여 고지합니다.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-cohort-ink-10 bg-cohort-ivory p-6 text-sm">
          <h2 className="text-base font-semibold text-cohort-ink-90">운영 주체</h2>
          <ul className="mt-3 space-y-1 text-cohort-ink-70">
            <li>상호명: 플랜사이</li>
            <li>사업자등록번호: 157-04-02001</li>
            <li>통신판매업신고번호: 2022-영등포-0450</li>
            <li>대표자: 조윤환</li>
            <li>사업장: 서울특별시 종로구 대학로 12길 61, 5층 501-87호</li>
            <li>유선: 010-4151-6626</li>
            <li>이메일: contact@cohort.co.kr</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
