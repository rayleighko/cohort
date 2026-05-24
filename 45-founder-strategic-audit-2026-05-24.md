# Cohort — Founder Strategic Audit (Level 10)

> **Audit context**: 사장님 페르소나 (15+ years 금융 업계 경험 + 핀테크 창업 경영) 관점의 brutal honest strategic audit
> **Audit date**: 2026-05-24 (Sprint 0 W2 mini-checkpoint 시점)
> **Scope**: Positioning + Market + Business Model 3축 + 자본시장법 reality check
> **Audit basis**: vault 38 + 39 + 40 + 14 + 00 정독 + 외부 시장 reality data (2024-2026 한국 핀테크 + Toss증권 AI launch + 자본시장법 2024 개정 + 한국 retail 시장 데이터)
> **Status**: Operator review request — *최종 의사결정 권한은 운영자 본인*. Cowork audit = 외부 sparring partner 관점 stress-test.

---

## 0. Executive Summary — 사장님 verdict (one paragraph)

Cohort는 **brand + product architecture 측면에서 sophisticated tier 수준의 작품**이다. 8-round naming, dual mascot, 석류 visual, Option B positioning, 3-layer safety filter — 이 정도 brand discipline은 한국 핀테크 스타트업 90%가 못 만든다. 운영자는 이걸 5주 안에 만들 수 있는 capacity가 있다. **그러나 — 본 audit에서 발견한 RED-FLAG 1개 + YELLOW-FLAG 3개는 W2 walkthrough 진행 전에 반드시 처리해야 한다.** RED는 *2024년 8월 시행 자본시장법 개정으로 인한 유사투자자문업 → 투자자문업 (자본금 5억 + 인가) 재분류 risk*. YELLOW는 *Toss증권 AI launch 2025로 인한 경쟁 wall*, *Aurora+Vesper dual persona의 onboarding cognitive load*, *Distribution 채널 hand-wave (가게점수 패턴 재현 risk)*. 결론: **PROCEED WITH CONDITIONS** — Sprint 0 build 중단 X, 단 W3 진입 전 3개의 *법무 + 경쟁 reality + UX 검증 gate*를 의무화하라.

---

## 1. RED FLAG #1 — 2024년 8월 자본시장법 개정 (이게 가장 큰 risk다)

### 1.1 발견된 사실 (2025 web search verified)

**금융위원회 2024년 8월 시행 자본시장법 개정 핵심 조항**:

> "유사투자자문업자는 단방향 채널을 이용해 불특정다수에게 개별성 없는 조언을 제공하는 영업만 허용되며, SNS·오픈채팅방 등 온라인 양방향 채널을 통해 유료 회원제로 영업하는 방식은 유사투자자문업자가 아닌 **투자자문업자**로 규율됩니다."

이 개정의 의미를 sophistication tier에서 해석하면:

- **2024년 8월 이전**: 유사투자자문업 신고 (5,000만원 자본금 + 신고서) — chatroom + 양방향 OK
- **2024년 8월 이후**: 양방향 채널 + 유료 회원제 = **투자자문업 인가 의무** (자기자본 5억원 + 임직원 자격 요건 + 금융위원회 인가)

### 1.2 Cohort 현재 architecture와의 직접 충돌

Vault 14 §14.3 Cohort architecture 중 **다음 3가지가 직접 trigger**:

| Cohort 요소 | 양방향 여부 | 유료 회원제 여부 | 규제 분류 risk |
|---|---|---|---|
| Aurora 🕊 in-app chat (Tier 2+) | ✅ 양방향 (사용자 질문 + Claude 응답) | ✅ Pro 24,900원/월 | **투자자문업 인가 risk HIGH** |
| Vesper 🦅 trigger alert + chat | ✅ 양방향 (alert 후 사용자 follow-up) | ✅ Pro tier | **투자자문업 인가 risk HIGH** |
| 분할매수 Timing Helper (Shape B) | △ 사용자 watchlist 기반 *개별화* output | ✅ Pro tier | **개별성 있는 조언으로 분류 가능** |

**Option B "추천 X / 정보 + 도구만" framing이 법적 보호로 작동하지 않는 핵심 이유**:
- 금융감독원은 **substance over label** 원칙을 적용한다 — UI label이 "정보"여도, 실질이 "특정 사용자에게 특정 상품 가치 판단 + 영업"이면 자문업이다
- 자본시장법 제6조 제1항 "투자판단에 관한 자문" 정의는 매우 넓다 — composite score, trigger alert, sentiment analysis 모두 포함 가능
- "본인이 결정하세요" disclaimer는 면책 효과 weak — 한국 법원은 substance 위주 판단

### 1.3 만약 투자자문업으로 분류되면 (worst case)

| 요건 | 수치 | Cohort 현재 상태 |
|---|---|---|
| 자기자본 | 5억원 (자문업 일반) — VC 투자 또는 founder personal 영역 | ❌ Elevate Studio 외주 회사 cashflow 1,200만원/월 with 인건비 + 운영비 = 잉여 ~0 |
| 임직원 자격 요건 | 투자권유자문인력 자격 보유자 1명 이상 | ❌ 운영자 본인 + 코파운더 + 직원 1 — 자격 보유자 X |
| 금융위원회 인가 | 인가 신청서 + 사업계획서 + 6개월+ 처리 기간 | ❌ Sprint 0 5주 cap과 충돌 |
| 분기 보고 + 감독 검사 | 정기 + 수시 검사 | ❌ Solo founder operation 부합 X |

**즉, 만약 worst case 발생 시 Cohort는 launch 자체가 illegal**. 미신고 자문업 영위 = 형사처벌 (5년 이하 징역 또는 2억원 이하 벌금, 자본시장법 제444조).

### 1.4 사장님으로서의 직설적 평가

> **Vault 14 §11 R4 "Tier 3 1:1 AI advisor 외부 법률 review" 한 줄로는 부족하다.** R4는 Tier 3 영역에만 적용되어 있다. 실제 risk는 **Tier 2 Aurora/Vesper chat 시점에 이미 trigger됨**. Vault 14 §14.4-pre disclaimer 강화도 면책 효과 weak — substance over label 원칙 때문.

### 1.5 즉시 actionable (W3 build 진입 전 의무)

**Gate 1 — 금융규제 전문 변호사 30-60분 consultation (예상 비용 30-50만원)**:

질의서 작성 시 다음 5개 질문 명시:
1. Cohort 현재 architecture (Aurora/Vesper chat + Pro tier 24,900원 subscription + 분할매수 timing helper)가 2024년 8월 개정 자본시장법 기준 **투자자문업** 또는 **유사투자자문업** 어느 쪽인가?
2. Option B framing ("정보 + 도구, 추천 X")이 법적 분류에 영향을 주는가, 아니면 substance 위주 판단인가?
3. 만약 투자자문업 분류 risk가 있다면, architecture re-design으로 **유사투자자문업 (5,000만 자본금 + 신고)** 수준으로 downgrade 가능한 path는?
4. 1:1 chat 제거 + 양방향 X + 매크로 정보 unicast만 (이메일 newsletter format)으로 가면 어떻게 분류되는가?
5. *법률자문 회신 본문 + 의견서* — Sprint 0 build start 전 명시 evidence base 확보

**예상 변호사 후보**:
- 김앤장 / 광장 / 율촌 / 세종 (top-tier, 비싸지만 정확)
- 핀테크 전문 부띠크 (예: 법무법인 한별, 법무법인 광장 핀테크팀)
- 추천: 한국핀테크지원센터 (fintech.or.kr) 무료 법률 자문 신청 (1차) → 유료 전문가 (2차)

**Gate 2 — Architecture defensive re-design 시나리오 준비**:

만약 변호사 회신이 "양방향 chat = 투자자문업 risk HIGH"이면:

- **Scenario A (full pivot)**: Aurora/Vesper chat 제거 → 매크로 dashboard + 정기 newsletter format only → 유사투자자문업 신고 path
- **Scenario B (delay chat)**: Tier 2 V1 = chat 없이 launch → 8-week PMF 확인 후 chat 도입은 Sprint 2+ + 법무 prep parallel
- **Scenario C (insurance)**: Disclaimers 더 강력 + 사용자 동의 명시 + 보험 (전문직 배상책임 보험) — 단 risk transfer effect weak

**Sprint 0 W2 walkthrough 영향**:
- 3명 personal network walkthrough에서 **Aurora chat demo 진행 OK** (현재 상태)
- 단 W3 build start 전 변호사 자문 결과 받은 후 architecture 확정
- 만약 chat 제거 path 선택 시 W2 walkthrough에서 chat reception 데이터는 *V2 prep용 reference*로 보관

---

## 2. YELLOW FLAG #1 — Toss증권 AI launch 2025 = 경쟁 wall

### 2.1 발견된 사실

**Toss증권 2025년 = AI 원년**. 다음 서비스를 retail 사용자에게 무료로 제공:
- AI Signal: "주가 움직임의 이유" — Cohort Shape A 매크로 narration과 직접 경쟁
- AI Earnings Call: 어닝콜 자동 요약 — Cohort sentiment digest 영역 경쟁
- Real-time issue alert: 실시간 이슈 push — Cohort Shape C trigger alert와 부분 경쟁
- Stock market calendar: 시장 일정 통합

**Toss 규모**:
- 토스 앱 MAU 2,480만 (Korean 인구 ~30%) — Cohort target Cluster B (Top 5-10% retail = 700K-1.5M) 거의 100% 포함
- 토스증권 연결 영업수익 ~2조원, 전년 대비 +42.7%
- 핀테크 기술팀 200+ engineer (ML 플랫폼 팀 별도)

**삼정KPMG report 2025**: 한국 생성형 AI 금융 서비스 시장 2024 $25.9M → 2030 $220M (CAGR 43.9%).

### 2.2 Cohort positioning 위협 분석

Vault 38 §6 "Anti-positioning" table은 Toss = "친구" mainstream으로 anti-positioned. 하지만 이 분리가 작동하는 조건은:
- Toss는 mainstream 영역만 cover (low-sophistication retail)
- Sophisticated retail은 Toss의 AI brief를 *insufficient*라고 판단

**Reality check** — Toss 2025 AI launch는 mainstream을 *fast-follow*한 sophisticated tier 영역에도 진입한다:
- AI signal "왜 주가가 움직였는가" = sophisticated retail이 원하는 explanation layer
- Earnings Call AI summary = Top 5-10%가 사용하는 핵심 정보 (Cohort target user의 routine workflow)
- Free + 이미 trust 확보 (2,480만 user) — switching cost 0

### 2.3 Cohort moat 재평가

Vault 38 + 14는 **3개의 differentiator**를 명시:
1. Macro composite score (Shape A) — *Toss AI signal과 직접 경쟁*, Toss가 더 풍부한 데이터 사용 가능
2. 분할매수 Timing Helper (Shape B) — *Toss/카카오페이증권의 alerting과 일부 경쟁*하나, Shape B의 *plan-based personalization*은 unique
3. Behavioral Guard / FOMO-Panic nudge (Shape C) — **이게 진짜 moat 후보**

**사장님 직설 평가**:
- Shape A의 macro composite + Aurora narration은 *Toss AI에 5-15분 안에 follow됨* (이미 launch함). 정보 자체로는 moat 약함.
- Shape B의 plan-based timing은 unique하나, *Top 5-10% retail이 실제로 plan을 형식화해서 도구에 입력하는가*가 question. 본인 plan을 머릿속 또는 excel sheet로 관리하는 패턴이 dominant.
- **Shape C behavioral guard만이 진짜 moat 후보** — Toss는 *engagement maximization* 사업 모델이라 panic/FOMO를 *완화*할 incentive가 약하다. Cohort는 *adherence maximization*이라 align됨. 이게 진짜 unique positioning.

### 2.4 즉시 actionable

**Gate 3 — Cohort positioning narrative 재집중**:

vault 38 §1.2 "Information + Tool + Decision Support"를 **"Behavioral Adherence Companion + Decision Reference"**로 narrative pivot 권장 (positioning *재정의*, framework는 동일).

새 positioning statement (사장님 검토):

> **Cohort는 한국 sophisticated retail이 *본인 plan과 호흡*하도록 돕는 behavioral adherence companion이다. 정보는 free (Toss/카카오페이증권에서 충분), Cohort는 본인이 작성한 plan에서 *벗어나지 않도록* 옆에서 walking pace를 유지한다.**

이 positioning은:
- Toss AI와 직접 경쟁 X (Toss = mainstream engagement, Cohort = sophistication adherence)
- 24,900원 가격 정당화 — adherence는 portfolio 1억원 기준 0.3%/년 = 30만원/년 = 24,900원/월의 가치 (행동 1번 panic sell 방지하면 손익 break-even)
- Aurora/Vesper dual mascot의 *진짜 의미* 강화 — "내 안의 dovish vs hawkish self의 평화" = behavioral coaching frame

**W2 walkthrough §2 core question 재정의** (현재 demo script와 alignment):
- 기존: "이 service가 1시간/day 정보 수집 burden을 줄여줄 것 같은가?"
- 추가: "본인이 panic sell / FOMO buy 한 경험 있는가? 이 service가 그 순간에 useful했을 것 같은가?"

후자 질문이 진짜 PMF signal — 전자는 Toss AI에 의해 commoditized 영역.

---

## 3. YELLOW FLAG #2 — Aurora + Vesper dual persona의 cognitive load

### 3.1 Brand intellectual elegance vs UX reality

Vault 38은 dual mascot 정당화 logic을 정교하게 구축:
- Disney/Mickey 패턴 (brand = category, character = emotion)
- *User's inner duality* (dovish vs hawkish self) framing
- 비둘기파/매파 통화정책 vocabulary 정합
- 6 dynamic states × 2 character = 12 visual variations

**사장님 직설 평가**:

이 framework는 **intellectually beautiful, commercially risky**. Reasons:

1. **30초 onboarding test 실패 risk**:
   - 한국 retail이 처음 service 접속 후 30초 내에 "이 service 뭐하는 거?" parse해야 함
   - "Aurora is dovish self, Vesper is hawkish self, both for inner concord" — *parsing 시간 60초+*
   - Toss는 "주식 + 즉시 매수" 30초 안에 onboarding 끝남

2. **2 character 동시 운영 = production cost 2배**:
   - Vault 43 mascot illustration brief 13개 master image (Aurora 6 + Vesper 6 + 석류 launcher) commissioning = $5-15K 외주
   - Voice consistency 유지 코드 + prompt management 2배
   - 6 dynamic state × 2 character = 12 push notification image variants — design + QA load
   - V2 animation 도입 시 추가 비용 2배

3. **User mental model crash risk**:
   - Vault 38 §2.4 selection logic: morning brief → Aurora, trigger alert → Vesper
   - 사용자가 "왜 같은 종목에서 어떨 때는 Aurora가, 어떨 때는 Vesper가 말하는지" parse 필요
   - 사용자의 expectation: "내 AI assistant 하나" (Toss AI, ChatGPT, Claude) — 이 default mental model을 break하는 것은 cost

4. **A/B test 어려움**:
   - Single character vs dual character A/B test는 *fundamental product change*라 5주 안에 불가능
   - Sprint 0에서 dual 선택 후 PMF check에서 dual이 문제라고 판단되면, V2에서 single로 pivot 시 brand identity 전체 re-build

### 3.2 Defensible Counter-argument (사장님이 dual을 유지하는 경우)

- Sophisticated retail = mainstream과 *differentiation 자체가 가치*. Dual mascot의 *elaboration*은 sophisticated tier signaling.
- 사람들은 *unique brand*를 추가 가격 지불할 의향 있음 (Apple, Nike, Patagonia 모델). Cohort = Nike of investing companions.
- Aurora vs Vesper의 *dovish/hawkish 통화정책 vocabulary*는 sophisticated retail이 실제로 사용하는 어휘 — instant rapport.

**사장님으로서 trade-off**: dual mascot = brand differentiation 강하나 onboarding friction + production cost 2x. Single = onboarding 빠르나 differentiation 약함.

### 3.3 즉시 actionable — W2 walkthrough에서 검증

**Gate 4 — W2 walkthrough에서 dual mascot reception 정량 측정**:

기존 demo script §3 Aurora chat demo를 다음으로 보강:
- 사용자에게 5분 자유 사용 후 다음 질문:
  1. "Aurora와 Vesper의 차이를 본인 말로 설명해주세요"
  2. "오늘 panic sell 충동이 들 때 누구에게 먼저 말 걸 것 같으세요?"
  3. "두 character를 동시에 사용하는 것이 *돕는다* vs *복잡하다* 어느 쪽인가요?"
- 답변을 verbatim quote로 보관 (P1/P2/P3 anonymized)

**의사결정 trigger**:
- 3명 중 2명+ "복잡하다" 또는 "차이 parse 어려움" 답변 → **Single mascot pivot 진지 검토**. Aurora 하나로 통합 + Vesper의 hawkish frame은 Aurora alert state로 흡수.
- 3명 중 2명+ "재미있다" 또는 "duality 이해됨" → **Dual maintain + Sprint 0 진행**.

이 Gate는 vault 43 mascot illustration 외주 commissioning 결정 *trigger point*. 외주 commitment = $5-15K, 단 single로 pivot 시 외주 새 brief 필요. **순서: walkthrough → dual/single 결정 → 외주 brief 확정**. 현재 vault 31-tracker "PRE-W5 commissioning" 명시도 W2 walkthrough 결과 후 commission이 정합.

---

## 4. YELLOW FLAG #3 — Distribution channel hand-wave (가게점수 패턴 재현 risk)

### 4.1 Vault 현재 distribution plan 분석

Vault 00 master context §10.3 v1.1.6 distribution boundary directive:
> "Personal network = founder 'step 1' but explicitly NOT a strict success prerequisite."

vault 14 §8 distribution risks:
> "Audience ~0": Path 2 anonymous Build in Public 또는 Path 3 paid acquisition 영역 — LOCK trigger 후 운영자 voice 결정"

vault 24 (mentioned in CLAUDE.md): "Pre-launch SEO 10-page production"

**사장님 직설 평가**:

이게 가장 큰 *불안 요인*이다. Reasons:

1. **가게점수 데이터의 직접 교훈**: 5주 build → 62 pageview → 1 CTA (운영자 본인 test) → 0 결제. **이 패턴 재현 가능성을 underweight했다.**
2. **Personal network 3명 = qualitative validation only — 결제 conversion path X**. Personal network 3명이 "useful하다" 답해도, 그건 결제 의향 1명 ≠ 시장 100명.
3. **SEO 10-page content는 9-18개월 후 effective** (Google indexing + ranking lag). Sprint 0 8-week cashflow checkpoint과 timeline mismatch.
4. **Toss community / Reddit "passive observation"은 *acquisition channel 아닌 *research channel** — distinction 중요.

### 4.2 8-week cashflow checkpoint reality math

Master Context Layer 3:
- 월 100만원 within 8 weeks = ~40명 paying user at 24,900원
- 월 500만원 within 6 months = ~200명 paying user
- 월 1,000만원 within 1 year = ~400명 paying user

Funnel math (industry standard for SaaS):
- 40 paying users at 8 weeks = needs ~400-800 trial signups (5-10% trial-to-paid)
- 400-800 trial signups = needs ~8K-16K landing visitors (5% landing-to-trial)
- 8K-16K visitors in 8 weeks = ~1,000-2,000 visitors/week = ~150-300/day

**Question**: 어디서 daily 150-300명 visitor를 sustained하게 가져올 것인가?

| 채널 | 8-week reality | Cohort 현재 prep |
|---|---|---|
| SEO content | ~0 (lag 9-18개월) | Vault 24 10-page draft |
| Paid ads (Google/Meta) | 가능 (Korean Google CPC ~500-2,000원) — 100만원/월 budget 시 500-1,000 click | 미준비 |
| Toss community / Reddit posting | 가능하나 controversy risk + 운영자 시간 | 미준비 |
| Korean retail Telegram channels (밸리ai/이효석 etc. cross-promote) | 가능하나 협력 outreach 필요 | 미준비 |
| Personal network | ~3-30명 trial 가능, conversion ~5-10명 | ✅ Step 2-3 진행 중 |
| Naver blog/카페 organic | 9-18개월 lag, Korean SEO 다름 | 미준비 |
| YouTube/Instagram content | 9-18개월 lag, content 생산 운영자 capacity 필요 | 미준비 |
| Product Hunt / IndieHackers launch | 영문 expansion Sprint 1+ 영역 | 영역 X (Korean V1) |
| 인플루언서 collab (한국 financial YouTuber) | 가능, 비용 100-500만원/post | 미준비 |

**Cowork 발견**: Distribution channel mix 중 **8-week cashflow checkpoint 도달 가능한 채널은 *Paid ads + 인플루언서 collab*뿐**. Organic 채널 모두 timeline mismatch.

### 4.3 즉시 actionable

**Gate 5 — Distribution channel commitment 명시화**:

W3 build start 전 다음 3-channel commitment + budget allocation:

| 채널 | Budget | Expected 8-week 결과 | 의무 prep |
|---|---|---|---|
| **Personal network (step 1)** | 0원 | 5-15 trial, 1-5 paying | 진행 중 |
| **Paid ads (Google + Meta)** | 200-500만원 (Sprint 0 W5 launch + 2주 burn) | 200-500 trial, 10-30 paying | Naver/Google AdWords account + landing copy + ad creative (3-5 variants) — *Sprint 0 W4 prep 의무* |
| **Korean financial 인플루언서 1-2 collab** | 100-300만원 sponsored post | 100-300 trial, 5-15 paying | Outreach list 20-30 후보 → 3-5 contact → 1-2 collab confirm. *Sprint 0 W3-W4 prep 의무* |

총 budget = 300-800만원 (Sprint 0 launch + 2주). Operator personal saving runway 1년 기준 **수용 가능 영역**.

**이 commitment를 W3 build start 전에 명시 lock-in**. 그렇지 않으면 가게점수 패턴 재현 high probability.

**Cowork이 prep 가능한 작업**:
- Korean financial 인플루언서 후보 list 20-30 (YouTuber + Telegram channel + 네이버 카페 운영자) — research 영역
- Paid ads landing copy + creative variant brief — copy 영역
- Funnel tracker spreadsheet (PostHog event → conversion math) — analytics 영역

---

## 5. Pricing 검증 — 24,900원 / 79,900원의 anchoring 재평가

### 5.1 Vault current pricing rationale

vault 00 §3 Cluster B.4:
- Free: Tier 0 + 48시간 trial
- Basic 9,900원/월 (anchor)
- Pro 24,900원/월 (target)
- Premium 79,900원/월 (advanced)

Rationale: "0.1% portfolio/year rule + 과거 실제 25,000원/월 결제 (N=1, 운영자 본인)"

### 5.2 한국 retail subscription benchmark (2026 시점 reality)

| 서비스 | 가격/월 | 영역 | Cohort와의 관계 |
|---|---|---|---|
| Toss증권 | 무료 (수수료 모델) | mainstream + AI brief | 경쟁 (free wall) |
| 카카오페이증권 | 무료 (수수료 모델) | mainstream | 경쟁 (free wall) |
| 키움증권 영웅문 | 무료 (수수료 모델) | sophisticated retail HTS | 경쟁 (free wall) |
| 네이버프리미엄 | 4,990원 | 콘텐츠 구독 | anchor (낮음) |
| 밸리ai | ~5,000-15,000원 | AI 종목 분석 | anchor (mid-low) |
| 이효석아카데미 | ~9,900-29,900원 | 매크로 + 강의 | **direct anchor** |
| TradingView Pro+ | 24.95 USD (~33,000원) | 차트 + 데이터 | sophisticated retail global |
| Koyfin Plus | 39 USD (~52,000원) | 매크로 + 데이터 (영문) | sophisticated retail global |
| Bloomberg Terminal | ~$24,000/년 (~2.6M원/월) | institutional | out-of-comparison |

### 5.3 사장님 평가

**Pro 24,900원**:
- 이효석아카데미 anchor와 정합 — defendable
- 단 *Toss/카카오페이가 free* + AI brief를 *24-36개월 내 sophisticated tier 확장* 가능성 = price wall
- 결제 의향 검증 base = N=1 (운영자 본인) — *fragile evidence*
- **Recommendation**: Pro 24,900원 maintain하되, *value differentiator를 informational에서 behavioral로 pivot* (§2.4 §2.3 참조)

**Premium 79,900원**:
- 한국 retail 영역에서 매우 높은 가격 (이효석아카데미 max보다 2.7x)
- "1:1 AI advisor" 영역은 §1 RED FLAG의 자본시장법 risk 직접 trigger
- **Recommendation**: V1 launch에서 Premium 79,900원 *defer to Sprint 2+*. Sprint 0 = Free + Pro 24,900 only. Premium tier는 *법무 + product polish + 사용자 demand 검증 후*.

**Free Tier 0 + 48시간 trial**:
- 48시간 trial은 너무 짧음. SaaS 산업 standard = 7-14일 (Master Context Layer 3 8주 cashflow checkpoint 영역에서는 14일 trial이 conversion data 더 풍부)
- **Recommendation**: 7-day free trial + no card required (vault 14 §2 Tier 1과 정합). 48시간은 *high commitment user only* 옵션으로 유지.

### 5.4 Cluster B sub-cluster pricing differentiation 재검토

Vault 38 §1.3 sub-clusters:
- B.1.a Sophisticated Disciplined (plan 있음, 분할매수)
- B.1.b Time-Constrained Emotional (시간 부족, behavioral guard 핵심)
- B.1.c English-Native Cross-cultural (영문 source 친숙)

**사장님 통찰**:
- B.1.a는 *self-sufficient* — 본인 plan 있고 분할매수 페이스 유지 능력 있음. *Cohort가 진짜 가치 제공하는가?* Question.
- B.1.b는 *behavioral guard 핵심 user* — Cohort의 진짜 PMF target. Pricing willingness 가장 높을 가능성.
- B.1.c는 *Korean V1 fit 약함* — 영문 expansion Sprint 1+ 영역으로 명시 분리

**Recommendation**:
- V1 launch positioning = **B.1.b primary** (Time-Constrained Emotional). Hero copy, ad creative, onboarding 모두 B.1.b voice로 lock-in.
- B.1.a는 *secondary user* — converts naturally if B.1.b experience is delightful, but not primary acquisition target.
- B.1.c는 *Sprint 1+ defer* — Korean V1 launch에서 영문 fraction 명시 제거.

이 narrowing이 marketing copy + ad creative + onboarding flow의 *coherent voice* 확보 핵심.

---

## 6. Phase 1 ↔ Phase 2 founder energy 충돌 평가

### 6.1 발견된 tension

Master Context §1.1-1.3:
- Phase 1 (2026-2028): Cashflow Operator — Cohort = portfolio product attempt
- Phase 2 (2028+): Game Founder — 코파운더와 게임 개발

vault 시점: Cohort가 월 2-3000만원 cashflow 도달 시 → 외주 sunset + Phase 2 진입.

**사장님 평가**:

이 plan은 **founder identity 분리가 가능하다고 가정**한다. 그러나:

1. **Sophisticated retail target audience의 trust는 *founder의 continuous market presence*에 의존**:
   - Cohort = "본인 plan과 호흡" companion service
   - Top 5-10% retail은 *founder가 실제로 매일 매크로를 watching하는가*에 대한 sniff test 진행
   - Phase 2 game dev 진입 시 macro attention 자연 감소 → 사용자가 차이 감지

2. **Cohort 월 2-3000만원 도달 = 6-18개월 sustained growth + churn 관리 + 새 기능 + 사용자 응대 영역**:
   - Solo founder operation + 외주 회사 운영 + Phase 2 game 준비 = capacity 충돌
   - DHH calm company 정합이라도, *sophisticated B2C subscription의 retention curve 유지*는 daily attention 영역

3. **Phase 2 game dev는 *5-10년 commitment* — Cohort sunset 또는 sale path 명시 없음**:
   - "도달 → 외주 sunset + Phase 2 진입" plan에서 Cohort의 운명은 *vague*
   - Sold to acquirer? Continued as side business? Sunset?
   - 이 ambiguity = sustained product investment에 negative impact (user trust + team focus)

### 6.2 사장님으로서의 직설

> **Cohort는 5년+ identity commitment 또는 *명시 exit path* 둘 중 하나가 필요하다.** 현재 plan은 "Phase 2 game이 진짜 dream이고 Cohort는 cashflow vehicle"인데, 이게 sophisticated retail user에게 *sniff out*된다. 운영자가 game을 더 사랑한다면, 사용자는 *Cohort founder가 자신을 cofounder처럼 함께 walking하는가*에 대한 trust 형성 어렵다.

### 6.3 권장 action — 운영자 본인 internal alignment

**Option 1 — Cohort identity full commitment**:
- Phase 2 game은 *Cohort exit 후 (acquirer sale 또는 Cohort handoff 후) trigger*
- Public narrative: "Cohort founder, ex-multi-product builder"
- 운영자 본인 매일 매크로 watching = product의 진짜 voice (founder = N=1 user)

**Option 2 — Cohort with explicit exit path**:
- Sprint 0 launch + 12-24개월 PMF + acquirer search (Toss, 카카오페이, 미래에셋, 한국투자 등) → handoff/sale → Phase 2 trigger
- Acquirer fit 명시 brief 작성 → 사용자에게 transparent하지 않아도 됨, 단 운영자 본인 plan으로 명시

**Option 3 — Cohort = 운영자 cashflow vehicle, sustained side business**:
- 외주 회사 + Cohort + Phase 2 game 3축 운영
- Cohort는 *expert retention* (운영자가 매일 attention 안 줘도 churn 유지 가능한 product feature) 설계 필수
- Sub-domain expert hire 가능성 (cofounder for Cohort, separate from Elevate Studio cofounder)

**Cowork은 이 결정에 입장 가짐 X — 운영자 본인 voice 영역**. 단 W2 walkthrough 결과 + W3 build 진입 시점에 internal alignment 의무 record (vault 31-tracker 또는 별도 file).

---

## 7. 의사결정 매트릭스 — BLOCK / RECONSIDER / PROCEED with Conditions

### 7.1 5 strategic axis verdict

| Axis | Vault 현재 design | Audit verdict | Reasoning |
|---|---|---|---|
| **Brand identity** (Cohort + Aurora + Vesper + 석류) | LOCKED 2026-05-21 | ✅ PROCEED | 8-round empirical, TM clean, sophisticated tier signaling 강함. 단 dual mascot UX cost는 §3에서 검증 |
| **Positioning** (Option B Information + Tool) | LOCKED | ⚠️ RECONSIDER → PIVOT TO "Behavioral Adherence Companion" | Vault label OK, 단 substance 변경 needed §2.4 |
| **Market** (Top 5-10% Korean sophisticated retail, B.1.a/b/c sub-clusters) | LOCKED | ⚠️ NARROW TO B.1.b PRIMARY for V1 | §5.4 — B.1.b가 진짜 PMF target |
| **Product architecture** (Tier 0/1/2/3 + Shape A/B/C + Dual mascot chat) | DRAFT (v1.1.7) | 🛑 BLOCK PENDING LEGAL — Tier 2 chat = 자본시장법 risk HIGH | §1 — 변호사 자문 의무 |
| **Pricing** (Pro 24,900 + Premium 79,900) | LOCKED | ⚠️ DEFER PREMIUM — V1 = Free + Pro only | §5.3 — Premium tier = 법무 risk 추가 + V1 scope discipline |
| **Distribution** (Personal network + SEO + post-launch TBD) | Path B Marc Lou ship-first | ⚠️ COMMIT MUST BEFORE W3 — Paid ads 200-500만원 + 인플루언서 100-300만원 lock-in 의무 | §4.3 — 가게점수 패턴 재현 risk mitigation |
| **8-week cashflow checkpoint** | Plan exists, threshold TBD | ⚠️ DEFINE NOW — Sunset/Iterate/Double-down threshold 명시 | §8 below |
| **Founder identity** (Phase 1 cashflow vs Phase 2 game) | Plan exists | ⚠️ OPERATOR-VOICE DECISION REQUIRED — 3 options §6.3 | Cohort identity commitment level 명시 |

### 7.2 종합 verdict — **PROCEED WITH 5 CONDITIONS**

Cohort Sprint 0 build를 **중단할 이유 없음** — brand + product quality는 sophisticated tier 수준. 단 다음 5개 gate를 **W3 build start 전 또는 W2-W3 transition 시점에 의무 통과**:

#### Gate 1 — 금융규제 변호사 30-60분 consultation (RED FLAG #1)

- 5개 질문 명시 (§1.5)
- 변호사 회신 evidence 명시 보관
- Architecture re-design scenario A/B/C 중 path 결정
- **예상 비용**: 30-50만원 (한국핀테크지원센터 무료 자문 → 유료 전문가)
- **예상 timeline**: 1-2주 (consultation booking + 회신)
- **Cowork이 도울 수 있는 영역**: 질의서 draft + 변호사 후보 research

#### Gate 2 — Toss AI 경쟁 reality 인정 + Positioning pivot (YELLOW #1)

- "Behavioral Adherence Companion" narrative re-frame
- Hero copy + onboarding + ad creative 모두 적용 (vault 17 landing page + 24 SEO content + 26 W2 build 영역 cascade)
- Shape A의 차별화는 약함을 인정 + Shape C behavioral guard 강화 focus
- **Cowork이 도울 수 있는 영역**: copy re-write + vault 17/24/26 cascade

#### Gate 3 — W2 walkthrough에서 dual mascot 검증 (YELLOW #2)

- Demo script §3 보강 (Aurora/Vesper parsing question 3개)
- 결과 verdict trigger: 2/3 "복잡하다" 시 single mascot pivot 진지 검토
- Mascot illustration 외주 commissioning은 walkthrough 결과 후 trigger
- **Cowork이 도울 수 있는 영역**: demo script update + walkthrough log template update

#### Gate 4 — Distribution channel commitment 명시 (YELLOW #3)

- W3 build start 전 3-channel commitment + budget lock-in (Personal + Paid ads + 인플루언서)
- Total budget: 300-800만원 (1년 personal saving runway 영역 수용 가능)
- Cowork prep: 인플루언서 후보 list + ad creative brief + funnel tracker
- **Cowork이 도울 수 있는 영역**: 인플루언서 research + landing copy + ads creative brief

#### Gate 5 — 8-week cashflow checkpoint threshold 명시 (§8)

- Sunset / Iterate / Double-down threshold 명시 + 운영자 self-commitment
- W2 walkthrough §0 사전 commitment template과 합쳐서 file 작성
- **Cowork이 도울 수 있는 영역**: threshold matrix + commitment template

---

## 8. 8-week cashflow checkpoint — 명시 threshold proposal

Master Context Layer 3: 월 100만원 within 8 weeks = ~40 Pro user (24,900원)

### 8.1 사장님 recommended threshold

| Result at 8-week post-launch | Verdict | Action |
|---|---|---|
| **< 10 paying users** (~25만원/월) | 🔴 **SUNSET** | Cohort hard sunset. Brand + code archive. Lessons → vault. Phase 1 next product 또는 외주 회사 focus. |
| **10-39 paying users** (25-100만원/월) | 🟡 **ITERATE** | Positioning + pricing + channel re-test for 8 more weeks. 16-week total before sunset trigger. |
| **40-99 paying users** (100-250만원/월) | 🟢 **PROCEED** | Scale acquisition. SEO content production. Premium tier introduction (post 법무 review). |
| **100+ paying users** (250만원+/월) | 🚀 **DOUBLE DOWN** | Aggressive acquisition budget. Hire 1 part-time engineer. Premium tier + Tier 3 advisory features (post 법무 + 자본 raise consideration). |

### 8.2 Pre-launch commitment 의무

운영자 본인 W2 walkthrough §0 commitment template과 동일 방식 — **pre-launch에 운영자 self-commitment 명시 record**:

> "8주 후 paying user 수가 < 10이면 sunset. 10-39이면 8주 iterate. 40+이면 proceed. 운영자 본인 commitment, 결과 후 commitment 변경 X."

이 commitment 없이 launch 시 — sunk cost bias로 8주 후 *threshold 자체를 낮추는 anti-pattern #14a* 재현 위험.

### 8.3 Cowork 권장 — additional metrics

8-week checkpoint에서 paying user count *외에* 다음 leading indicators 추적:
- Trial signup count + trial-to-paid conversion rate
- Free Tier 0 dashboard DAU (entry funnel health)
- Aurora chat session count + safety filter trigger rate
- Push notification open rate + retention curve
- Churn rate Week 1 / Week 4 / Week 8

이 leading indicator가 *qualitative iterate signal* — paying user count는 *lagging metric*만.

---

## 9. W2 mini-checkpoint walkthrough — 본 audit 결과 반영

### 9.1 Demo script §0 사전 commitment 보강

기존 4 시나리오 (3/3, 2/3, 1/3, 0/3) 외에 다음 추가:

**Scenario E — Mascot dual/single verdict**:
- 3명 중 2명+ "Aurora/Vesper 차이 parse 어려움" → Single mascot pivot 진지 검토 (Aurora maintain, Vesper merge to alert state)
- 3명 중 2명+ "duality 이해됨 + 재미있다" → Dual maintain + Sprint 0 진행

**Scenario F — Behavioral guard primary value verdict**:
- 3명 중 2명+ "panic sell / FOMO buy 경험 있고, 이 service가 그 순간 useful했을 것" → Behavioral Adherence Companion positioning pivot 진행
- 3명 중 2명+ "informational value (Toss와 비교)" 언급 → Positioning re-think + Toss AI 경쟁 wall 평가 deepen

### 9.2 Demo script §2 core question 보강

기존:
- "1시간/day 정보 수집 burden을 줄여줄 것 같으세요?"

추가:
- "본인이 panic sell / FOMO buy 한 경험 있으세요? 이 service가 그 순간 useful했을 것 같으세요?"
- "Aurora와 Vesper의 차이를 본인 말로 설명해주세요" (mascot reception)
- "Toss증권 AI brief + Cohort 두 service가 다 있다면 어느 것에 24,900원 지불할 것 같으세요?" (경쟁 reality)

### 9.3 Demo script §3 Aurora chat demo 보강

기존:
- Advisory request "지금 매수해야 할까?" 시도 → safety filter 작동 확인

추가 (audit RED FLAG #1 영역):
- Sub-test 1: "분할매수 1차 timing 지금 맞을까요?" — Shape B 개별성 있는 조언 trigger 시도
- Sub-test 2: "삼성전자 watchlist 추가했는데 어떻게 진행해야 할까요?" — 개별화 advice trigger 시도
- Sub-test 3: "오늘 매크로 상태 보고 portfolio 비중 조정해야 할까요?" — composite portfolio advisory trigger 시도

이 3개 sub-test가 모두 safety filter에 의해 redirect 작동 verify. 만약 1개라도 substance-level advice가 leak되면 → 변호사 자문 시점에 *evidence로 제출* + architecture re-design priority 1.

---

## 10. Cowork이 진행 가능한 후속 작업 (사장님 결정 후)

W2 walkthrough 결과 받은 후 Cowork이 단일 또는 multi-turn 내 진행 가능:

| 작업 | Trigger | Cowork capacity | 사장님 결정 필요 영역 |
|---|---|---|---|
| 변호사 질의서 draft (Gate 1) | 사장님 confirm "법무 consultation 진행" | 1 turn | 변호사 후보 선택 (Cowork research → 사장님 결정) |
| Korean financial 인플루언서 list 20-30 research (Gate 4) | 사장님 confirm "distribution commit 진행" | 1-2 turn | 협력 trigger budget + outreach voice |
| Positioning pivot copy re-write — Hero + onboarding + ad (Gate 2) | 사장님 confirm "Behavioral Adherence Companion narrative" | 2-3 turn (vault 17 + 24 + 26 cascade) | Final voice 결정 |
| 8-week checkpoint threshold + commitment file (Gate 5) | 사장님 confirm "threshold 명시" | 1 turn | Threshold 수치 final 결정 |
| W2 demo script update (audit 반영) | 사장님 confirm "audit 결과 반영" | 1 turn | 추가 question final voice |
| Vault 14 §14 architecture re-design (변호사 회신 후) | 변호사 회신 + path 결정 | 2-3 turn | Architecture path 결정 |
| Mascot single/dual pivot brief (W2 walkthrough verdict 후) | walkthrough 결과 + dual/single 결정 | 1 turn | Single 선택 시 Aurora 통합 brief 결정 |
| 8-week leading indicator dashboard prep (PostHog event spec) | Gate 5 결정 후 | 1-2 turn | Indicator priority |

---

## 11. 사장님으로서의 final closing thought

Cohort는 **technically excellent product attempt**다. Operator의 capacity, brand discipline, methodology rigor, vault organization — 이 정도 sophistication을 솔로 founder가 5주 안에 빌드할 수 있는 case는 한국에서 흔치 않다. 사장님이 이 attempt에 *진심*이라는 것이 vault 38-43 모든 문서에서 드러난다.

**그러나 진심과 commercial success는 다른 game이다.** Sprint 0 5주 build를 끝내고 Sprint 1 8주 PMF window에서 마주칠 reality는 다음과 같다:

1. **2024년 8월 자본시장법 개정으로 architecture re-design risk 있음** — 이걸 W3 진입 전 verify 안 하면, launch 후 service take-down 또는 형사 risk
2. **Toss증권 2025 AI launch로 정보 layer 영역 commoditized** — informational moat 약함 인정 + behavioral moat focus pivot
3. **가게점수 패턴 (5주 build → 62 pageview → 0 결제) 재현 가능성 high** — distribution channel commitment 명시 안 하면 8주 cashflow checkpoint 미달
4. **Aurora + Vesper dual mascot의 brand elegance vs UX cost trade-off** — W2 walkthrough에서 검증 안 하면 production cost 2x sunk
5. **Phase 1 ↔ Phase 2 founder identity tension** — 운영자 본인 internal alignment 없으면 user trust 형성 어려움

**이 5개 gate를 통과한 Cohort는 한국 sophisticated retail 시장에서 *진짜 가치* 만들 가능성 강하다.** 통과 안 한 Cohort는 vault 28-mascot-joon (deprecated) 처럼 *역사 archive*가 될 위험.

**사장님 자신의 capacity를 믿되, 시장과 규제와 경쟁사의 realism도 그만큼 respect하자.** 이게 15+년 핀테크 founder의 진짜 lesson이다.

---

## 12. Audit verdict — single sentence

> **Cohort PROCEED with 5 conditions (Gate 1-5).** Sprint 0 W2 walkthrough 진행 + 결과 받은 후 *변호사 자문 + positioning pivot + dual mascot 검증 + distribution commit + 8주 threshold 명시* 5개를 W3 build start 전에 의무 통과. 통과 못 한 gate가 있으면 *Sprint 0 W3 build start trigger X*. Anti-pattern #14 (premature lock-in)과 anti-pattern #13 (sunk cost) 모두 회피 path.

---

## Sources (외부 reality data)

본 audit는 다음 외부 source의 reality data를 reference함:

- [자본시장법상 유사투자자문업자 규제 (KCI 학술논문)](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001997435)
- [유사투자자문업 해당여부 — 금융위원회 유권해석 (LBOX)](https://lbox.kr/v2/interpretation/%EA%B8%88%EC%9C%B5%EC%9C%84%EC%9B%90%ED%9A%8C-%EB%B2%95%EB%A0%B9%ED%95%B4%EC%84%9D-240300)
- [금융위원회·금융감독원 유권해석 (CaseNote)](https://casenote.kr/%EA%B8%88%EC%9C%B5%EC%9C%84%EC%9B%90%ED%9A%8C%C2%B7%EA%B8%88%EC%9C%B5%EA%B0%90%EB%8F%85%EC%9B%90/f398874829)
- [유사투자자문업 시작 시 유의점 (Nepla)](https://www.nepla.ai/wiki/%EA%B8%88%EC%9C%B5-%ED%88%AC%EC%9E%90-%EC%99%B8%EA%B5%AD%ED%99%98/%EC%9E%90%EB%B3%B8%EC%8B%9C%EC%9E%A5/%EC%9C%A0%EC%82%AC%ED%88%AC%EC%9E%90%EC%9E%90%EB%AC%B8%EC%97%85%EC%9D%84-%EC%8B%9C%EC%9E%91%ED%95%A0-%EB%95%8C-%EC%9C%A0%EC%9D%98%ED%95%A0-%EC%A0%90-j3wnkoz148y6)
- [유사투자자문업 등록 방법 및 리딩 시 유의사항 (대륜)](https://www.daeryunlaw-comp.com/lawInfo_new/26)
- [유사투자자문업자 목록 (파인 — 금융소비자정보포털)](https://fine.fss.or.kr/fine/fncco/invsmCnsut/list.do?menuNo=900046)
- [유사투자자문업자 불건전영업행위 규율 강화 보도자료 (금융위원회)](https://www.fsc.go.kr/no010101/82887)
- [금융위원회 자본시장정책 정책일반](https://www.fsc.go.kr/po010106/82885)
- [Korean Stock Market Outlook 2025 (Bitget)](https://www.bitget.com/wiki/korean-stock-market-outlook-2025)
- [Korean Retail Investors 2025 (KED Global)](https://www.kedglobal.com/korean-stock-market/newsView/ked202512230002)
- [Korean retail investors in US leveraged ETFs (KED Global)](https://www.kedglobal.com/stocks/newsView/ked202512230007)
- [Activist Korean retail investors (Fortune Asia 2025)](https://fortune.com/asia/2025/06/09/retail-investors-korea-discount-kospi/)
- [Toss증권 AI 서비스 — 시장 변동의 이유 (Toss corp)](https://corp.tossinvest.com/ko/news-room/detail?id=42819)
- [Toss증권 AI Campaign](https://www.tossinvest.com/ai-campaign)
- [Toss증권 2025 AI 원년 (Byline Network)](https://byline.network/2025/12/1217-3/)
- [Toss증권 ML 플랫폼 — 머신러닝 증권 뉴스 (Toss SLASH-23)](https://toss.im/slash-23/session-detail/B2-4)
- [한국 핀테크 생태계 AI (Skywork)](https://skywork.ai/skypage/ko/%ED%95%9C%EA%B5%AD-%ED%95%80%ED%85%8C%ED%81%AC-%EC%83%9D%ED%83%9C%EA%B3%84:-%EA%B2%B0%EC%A0%9C-%EB%84%88%EB%A8%B8%EC%9D%98-AI,-%EA%B8%88%EC%9C%B5-%ED%98%81%EC%8B%A0%EC%9D%84-%EC%9D%B4%EB%81%8C%EB%8B%A4/1948220076892962816)
- [2025 한국 디지털금융 주요이슈 (삼정KPMG)](https://assets.kpmg.com/content/dam/kpmg/kr/pdf/2025/business-focus/%EC%82%BC%EC%A0%95KPMG-2025%EB%85%84-%EA%B5%AD%EB%82%B4-%EB%94%94%EC%A7%80%ED%84%B8%EA%B8%88%EC%9C%B5-%EC%A3%BC%EC%9A%94-%EC%9D%B4%EC%8A%88_20250314.pdf)

---

## Audit metadata

- **Author**: Cowork as Level 10 senior fintech founder persona
- **Date**: 2026-05-24
- **Audit duration**: ~60분 (vault 정독 + 외부 reality search + synthesis)
- **Verdict format**: BLOCK / RECONSIDER / PROCEED with 5 conditions
- **Operator review priority**: HIGH (RED FLAG #1 = launch-blocking risk)
- **Cowork next action**: 사장님 review 후 Gate 1-5 중 어느 것 먼저 진행할지 결정 받음
- **File path**: `~/Development/cohort/45-founder-strategic-audit-2026-05-24.md`
- **Vault integration**: 본 audit는 vault 38 + 39 + 40 + 14 + 00 cascade. 운영자 review 후 vault 31-tracker 또는 23-batch-review-prep에 reference 추가 권장.
