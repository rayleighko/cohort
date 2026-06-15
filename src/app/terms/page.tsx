import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | 코호트',
  description:
    '코호트 이용약관 — 운영자가 제공하는 코호트 서비스의 이용 권리·의무·환불·면책·분쟁 해결.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10 border-b border-cohort-ink-10 pb-6">
        <h1 className="text-3xl font-semibold text-cohort-ink-90 md:text-4xl">
          이용약관
        </h1>
        <p className="mt-3 break-keep text-sm text-cohort-ink-50">
          시행일자: 2026-06-15 (V1 출시) · 최종 수정: 2026-05-27
        </p>
      </header>

      <article className="break-keep text-base leading-relaxed text-cohort-ink-70">
        <section>
          <h2 className="text-xl font-semibold text-cohort-ink-90">제1조 (목적)</h2>
          <p className="mt-3">
            이 약관은 본 서비스를 운영하는 개인 운영자(이하 &ldquo;운영자&rdquo;)가
            제공하는 코호트 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
            운영자와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">제2조 (정의)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              <strong className="text-cohort-ink-90">&ldquo;서비스&rdquo;</strong>: 코호트가
              제공하는 매크로 대시보드, 분할매수 의사결정 도구, 사용자 설정 조건 알림,
              Aurora 🕊 + Vesper 🦅 마스코트 AI 대화 등 정보 + 도구 + 의사결정 지원
              서비스를 의미합니다.
            </li>
            <li>
              <strong className="text-cohort-ink-90">&ldquo;이용자&rdquo;</strong>: 본
              약관에 따라 운영자가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
            </li>
            <li>
              <strong className="text-cohort-ink-90">&ldquo;회원&rdquo;</strong>: 운영자와
              서비스 이용계약을 체결하고 이용자 아이디를 부여받은 자를 말합니다.
            </li>
            <li>
              <strong className="text-cohort-ink-90">&ldquo;이용 등급&rdquo;</strong>: 서비스
              기능 단계로서 무료(등급 0), 무료 체험(등급 1), 프로(등급 2, 월
              24,900원), 프리미엄(등급 3, 월 79,900원)으로 구분됩니다.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제3조 (약관의 게시와 개정)
          </h2>
          <p className="mt-3">
            운영자는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에
            게시합니다. 운영자는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의
            규제에 관한 법률」, 「전자문서 및 전자거래기본법」, 「전자금융거래법」,
            「개인정보 보호법」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할
            수 있습니다. 약관 개정 시 변경사항의 시행일자 및 사유를 명시하여 적용일자
            7일 이전부터 적용일자 전일까지 공지합니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제4조 (이용계약의 성립)
          </h2>
          <p className="mt-3">
            이용계약은 이용자가 본 약관 및 개인정보 처리방침에 동의한 후 회원 가입
            신청을 하고, 운영자가 이를 승낙함으로써 성립합니다. 운영자는 다음 각 호에
            해당하는 신청에 대하여 승낙을 하지 아니하거나 사후에 이용계약을 해지할 수
            있습니다.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            <li>만 14세 미만의 미성년자가 신청한 경우</li>
            <li>신청 내용에 허위, 기재누락, 오기가 있는 경우</li>
            <li>기타 운영자가 정한 이용신청 요건이 미비된 경우</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">제5조 (서비스의 제공)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              <strong className="text-cohort-ink-90">등급 0 (무료)</strong>: 매크로
              대시보드 핵심 지표, 일별 KOSPI·코스닥 히트맵, 일별 공시 목록(지연
              데이터).
            </li>
            <li>
              <strong className="text-cohort-ink-90">등급 1 (무료 체험, 14일)</strong>:
              등급 0 + 사용자 설정 조건 알림 1개 + 관심종목 5종목 + 일별 시장
              심리 요약. 카드 등록 없이 시작하며 자동 결제 전환되지 않습니다.
            </li>
            <li>
              <strong className="text-cohort-ink-90">등급 2 프로 (월 24,900원)</strong>:
              매크로 대시보드 확장 + 사용자 맞춤 위젯 + 분할매수 의사결정 지원
              (3점수 통합) + 사용자 설정 조건 알림 + 행동 가드 + 관심종목
              30종목 + Aurora · Vesper 마스코트 앱 내 대화.
            </li>
            <li>
              <strong className="text-cohort-ink-90">등급 3 프리미엄 (월 79,900원)</strong>:
              등급 2 기능 + 더 빠른 알림 + 거장 투자 방식 교육 시뮬레이션(일반 투자
              교육 정보).
            </li>
          </ol>
          <p className="mt-4">
            서비스 제공 시간: 연중무휴 24시간 (단, 시스템 점검 및 외부 데이터 제공
            시간 제약 제외).
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제6조 (서비스의 본질 — 정보 + 도구 + 의사결정 지원)
          </h2>

          <div className="mt-4 rounded-2xl border border-cohort-primary/30 bg-cohort-primary/5 p-5">
            <p className="text-sm font-semibold text-cohort-primary">
              자본시장법 정합 — 중요 고지
            </p>
            <p className="mt-2 text-sm text-cohort-ink-70">
              코호트는 정보 제공 + 도구 + 의사결정 지원 서비스이며, 자본시장법상
              투자자문업 또는 투자일임업이 아닙니다. 본 서비스는 투자 권유 또는 추천을
              하지 않으며, 모든 투자 결정과 그 결과는 이용자 본인의 책임입니다.
            </p>
          </div>

          <h3 className="mt-6 text-base font-semibold text-cohort-ink-90">
            제6.1조 운영자가 제공하는 영역
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>매크로 지표, 가격 데이터, 공시 정보 등 일반 정보 제공</li>
            <li>사용자가 입력한 본인 투자 계획 참조 도구</li>
            <li>매크로·기술·심리 통합 점수 영역 표시</li>
            <li>사용자가 설정한 조건 알림</li>
            <li>
              Aurora 🕊 + Vesper 🦅 마스코트 AI의 일반 투자 교육, 본인 투자 계획 참조,
              멘탈 관리, 원칙 강화 대화
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-cohort-ink-90">
            제6.2조 운영자가 제공하지 않는 영역
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>개별 종목 매수/매도 추천 (&ldquo;X 종목을 사세요&rdquo; 등)</li>
            <li>구체적 비중 권장 (&ldquo;비중 X%로 가세요&rdquo; 등)</li>
            <li>매매 시점 추천 (&ldquo;지금이 매수 시점입니다&rdquo; 등)</li>
            <li>자동 매매 (사용자 대신 매매 실행)</li>
            <li>개인 맞춤형 투자 자문 (자본시장법상 자문업 등록 후 가능 영역)</li>
          </ul>
          <p className="mt-3">
            Aurora · Vesper AI는 위 영역의 질의에 대해 본인 투자 계획 재점검 안내로
            전환됩니다.
          </p>

          <h3 className="mt-6 text-base font-semibold text-cohort-ink-90">
            제6.3조 사용자 의사결정 책임
          </h3>
          <p className="mt-2">
            서비스에서 제공하는 모든 정보 + 도구 + 점수는 사용자의 의사결정을
            지원하기 위한 것입니다. 최종 투자 결정은 전적으로 사용자 본인의 책임이며,
            운영자는 사용자의 투자 결과에 대해 법적 책임을 부담하지 않습니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">제7조 (이용자의 의무)</h2>
          <p className="mt-3">이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            <li>신청 또는 변경 시 허위 내용의 등록</li>
            <li>타인의 정보 도용</li>
            <li>운영자가 게시한 정보의 변경</li>
            <li>운영자가 정한 정보 이외의 정보 송신 또는 게시</li>
            <li>운영자 또는 제3자의 저작권 등 지적재산권 침해</li>
            <li>운영자 또는 제3자의 명예 손상 및 업무 방해</li>
            <li>외설·폭력적 메시지 또는 공서양속에 반하는 정보의 공개·게시</li>
            <li>본 약관 또는 개인정보 처리방침 위반</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제8조 (요금 결제 및 환불)
          </h2>
          <h3 className="mt-4 text-base font-semibold text-cohort-ink-90">제8.1조 결제</h3>
          <p className="mt-2">
            등급 2 프로(월 24,900원) 또는 등급 3 프리미엄(월 79,900원) 구독은
            토스페이먼츠를 통해 원화(KRW)로 결제됩니다. 결제 정보는
            토스페이먼츠에 의해 처리되며 운영자는 카드 정보를 직접 저장하지 않습니다.
          </p>

          <h3 className="mt-5 text-base font-semibold text-cohort-ink-90">
            제8.2조 환불 정책
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-cohort-ink-90">무료 체험 (등급 1, 14일)</strong>:
              카드 등록 불필요, 자동 결제 전환 없음.
            </li>
            <li>
              <strong className="text-cohort-ink-90">유료 구독 시작 후 7일 이내</strong>:
              「전자상거래법」 제17조에 따라 청약철회 가능 (전액 환불).
            </li>
            <li>
              <strong className="text-cohort-ink-90">유료 구독 7일 이후</strong>: 잔여
              기간 비례 환불 가능 (디지털 콘텐츠 사용량 비례 환불).
            </li>
            <li>
              <strong className="text-cohort-ink-90">자동 갱신 중단</strong>: 다음
              갱신일 24시간 이전까지 설정에서 갱신 중단 가능.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">
            제9조 (서비스의 변경 및 중단)
          </h2>
          <p className="mt-3">
            운영자는 운영상, 기술상 필요에 따라 제공하고 있는 서비스를 변경할 수
            있습니다. 서비스 설비의 보수, 전기통신사업법상 기간통신사업자의 전기통신
            서비스 중지, 기타 불가항력 사유가 있는 경우 일시적으로 서비스 제공을 중단할
            수 있습니다. 서비스 중단으로 인하여 이용자 또는 제3자가 입은 손해에 대하여
            운영자는 배상하지 않습니다. 단 운영자의 고의 또는 중과실이 있는 경우는
            제외합니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">제10조 (면책 조항)</h2>

          <h3 className="mt-4 text-base font-semibold text-cohort-ink-90">
            제10.1조 투자 결과 면책
          </h3>
          <p className="mt-2">
            운영자는 본 서비스를 통해 제공되는 정보 + 도구 + 점수에 기반한 사용자의 투자
            결정 및 그 결과에 대해 책임을 부담하지 않습니다. 모든 투자 결정과 손익은
            사용자 본인의 책임입니다.
          </p>

          <h3 className="mt-5 text-base font-semibold text-cohort-ink-90">
            제10.2조 데이터 정확성 면책
          </h3>
          <p className="mt-2">
            운영자는 매크로 지표, 가격 데이터, 공시 정보 등 외부 제공처에서 제공되는
            데이터의 정확성을 위해 최선의 노력을 다하나, 외부 제공처의 오류·지연·누락에
            의한 손해에 대해 책임을 부담하지 않습니다.
          </p>

          <h3 className="mt-5 text-base font-semibold text-cohort-ink-90">
            제10.3조 AI 안전 필터 면책
          </h3>
          <p className="mt-2">
            Aurora · Vesper AI는 자본시장법상 자문업 회피를 위한 안전 필터가 활성화되어
            있으나, AI의 한계로 인한 일부 부정확한 응답 발생 가능성에 대해 운영자는
            책임을 부담하지 않습니다. 사용자는 AI 응답을 참고 정보로만 활용해야 합니다.
          </p>

          <h3 className="mt-5 text-base font-semibold text-cohort-ink-90">
            제10.4조 사칭 면책
          </h3>
          <p className="mt-2">
            서비스 외부 채널(텔레그램, 카카오톡 등)에서 발생하는 코호트 또는 Aurora ·
            Vesper 마스코트를 사칭하는 행위에 의한 피해에 대해 운영자는 책임을 부담하지
            않습니다. 운영자의 공식 채널은 본 서비스(cohort.co.kr)에 한정됩니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">제11조 (분쟁 해결)</h2>
          <p className="mt-3">
            본 약관에 명시되지 않은 사항은 「전자상거래 등에서의 소비자보호에 관한
            법률」, 「약관의 규제에 관한 법률」, 「자본시장과 금융투자업에 관한 법률」
            등 관계 법령 또는 상관례에 따릅니다. 본 약관 및 서비스 이용과 관련하여
            분쟁이 발생한 경우, 운영자와 이용자 간 협의를 통해 해결합니다. 협의로
            해결되지 않은 경우 「민사소송법」 상의 관할 법원에 제소할 수 있으며, 1심
            관할 법원은 서울중앙지방법원으로 합니다.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-cohort-ink-90">부칙</h2>
          <p className="mt-3">본 약관은 2026-06-15부터 시행합니다.</p>
        </section>

        <section className="mt-12 rounded-2xl border border-cohort-ink-10 bg-cohort-ivory p-6 text-sm">
          <h2 className="text-base font-semibold text-cohort-ink-90">운영 주체</h2>
          <ul className="mt-3 space-y-1 text-cohort-ink-70">
            <li>운영 형태: 개인 운영 서비스</li>
            <li>이메일: gmj1197@gmail.com</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
