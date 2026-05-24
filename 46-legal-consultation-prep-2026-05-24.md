# Cohort — Gate 1 법무 자문 Prep (자본시장법 자문업 risk verification)

> **Trigger**: `45-founder-strategic-audit-2026-05-24.md` §1 RED FLAG #1 (2024년 8월 자본시장법 개정 = 양방향 chat + 유료 회원제 → 투자자문업 인가 risk)
> **목적**: W3 build start 전 Cohort architecture가 *유사투자자문업 / 투자자문업 / 비자문업* 중 어느 것에 해당하는지 *명시 evidence* 확보
> **Approach**: 2-tier (Tier 1 무료 한국핀테크지원센터 → Tier 2 유료 전문가 verify) — 비용 효율 + risk depth balance
> **Status**: 사장님이 본 file 받은 후 (1) 무료 자문 신청 → (2) 회신 받은 후 유료 전문가 booking 결정
> **Vault integration**: 본 file은 vault 45 audit의 Gate 1 deliverable. 진행 후 결과는 vault 22-compliance-review-prep + 31-tracker §1.5 lock-in entry로 cascade.

---

## 0. 사장님 진행 instructions — 3 step

### Step A — 무료 1차 자문 신청 (5분, 비용 0원)

**한국핀테크지원센터 (sandbox.fintech.or.kr)** 사이트 접속 → 법률 컨설팅 신청

- 신청 form에 §3 질의서 본문 paste
- 회신 기간: 1-3주 (전문지원단 lawyer 67인 중 1명 배정)
- 회신 형태: 서면 의견서 (PDF 또는 email)
- 신청 link 검색 keyword: "한국핀테크지원센터 법률 컨설팅" 또는 "금융규제 샌드박스 컨설팅 신청"

**중요**: 이 무료 자문은 *공식 금융위 산하 기관 lawyer*가 회신함. 회신 내용은 *권위 있는 1차 evidence*로 활용 가능. 단 *특정 case의 final 분류 책임은 지지 않음* — Step B-C가 backup.

### Step B — 회신 evaluation + 유료 전문가 decision (Step A 회신 1-3주 후)

**시나리오 A** — 무료 자문 회신이 "양방향 chat + Pro tier = 투자자문업 risk LOW, 유사투자자문업 신고로 충분":
- 유료 전문가 booking *불필요*
- 유사투자자문업 신고 진행 (자본금 5,000만원 + 신고서)
- Sprint 0 W3 build 진입 OK

**시나리오 B** — 무료 자문 회신이 "양방향 chat + Pro tier = 투자자문업 risk HIGH":
- §2 유료 전문가 1명 booking (30-60분 consultation, 50-150만원)
- Architecture re-design path 결정 (Scenario A/B/C — vault 45 §1.5)
- W3 build path 변경

**시나리오 C** — 무료 자문 회신이 "ambiguous / case-by-case" 또는 verification 영역:
- §2 유료 전문가 1명 booking (확인 영역)
- 더 명확한 path 확보

### Step C — 운영자 결정 + vault lock-in

- 회신 결과 vault 22-compliance-review-prep §R4 영역 update
- vault 31-tracker §1.5 entry 추가 (법무 status lock-in)
- Cowork에 결과 share → architecture re-design 또는 build 진행 trigger

---

## 1. 변호사/법무법인 후보 list (tiered)

### Tier 1 — 무료 옵션 (Step A 권장)

| # | 기관 | 비용 | 적합도 | Notes |
|---|---|---|---|---|
| 1 | **한국핀테크지원센터 전문지원단** | 0원 | ★★★★★ | 금융위 산하 official + lawyer 67인. Cohort 같은 케이스에 *직접 적합*. 신청 sandbox.fintech.or.kr |
| 2 | 서울시 핀테크랩 (마포 디지털금융센터) | 0원 | ★★★★ | 핀테크 스타트업 대상 정기 법률 자문 program. 자격 요건 check 필요. |
| 3 | 금융보안원 핀테크 보안 자문 | 0원 | ★★ | 보안 focus, 자문업 분류 question은 secondary |

### Tier 2 — 유료 전문가 (Step B trigger 시)

#### 2.1 Top-tier 대형 로펌 (높은 신뢰도 + 높은 비용)

| 법무법인 | 추천 변호사 | 비용 estimate | Best fit 영역 |
|---|---|---|---|
| **김앤장 법률사무소** | 최은경 변호사 (Who's Who Legal Korea 2025, 핀테크/금융규제 전문) / 이정민 변호사 (자본시장법) | 30분 ~80-150만원, 60분 ~150-300만원 | 가장 권위 있는 자문, 대기업/금융기관 client 다수 — *Cohort scale에는 oversized 가능* |
| **법무법인 광장** | 최재백 변호사 (Who's Who Legal Korea 2025, 자본시장) 또는 핀테크팀 senior lawyer | 30분 ~70-130만원, 60분 ~130-250만원 | 자본시장법 깊은 전문성 |
| **법무법인 태평양** | 김앤장 인프라 파이낸스팀 영입 (2025) — 핀테크/금융 전문 | 30분 ~60-120만원, 60분 ~120-220만원 | 2025 매출 2위, fintech 강화 |
| **법무법인 세종** | 자본시장 팀 | 30분 ~50-100만원, 60분 ~100-200만원 | 자본시장법 전통 강함 |
| **법무법인 율촌** | 금융규제 팀 | 30분 ~50-100만원, 60분 ~100-200만원 | 금융규제 강함 |

#### 2.2 핀테크 specialist 부띠크 (적정 비용 + 직접 fit)

| 법무법인 | 특징 | 비용 estimate | Best fit 영역 |
|---|---|---|---|
| **법무법인 비컴 (BeCome)** | 혁신금융센터 비컴 운영, fintech 전문 부띠크 | 30분 ~30-60만원, 60분 ~60-120만원 | 핀테크 스타트업 client 다수, sandbox 신청 지원 경험 |
| **차앤권 법률사무소** | 가상자산·블록체인·스타트업 fintech 전문 | 30분 ~20-50만원, 60분 ~50-100만원 | 스타트업 friendly, 가상자산 비중 높음 |
| **법무법인 화우 디지털금융센터** | 핀테크 전문 + 금융규제 전문 | 30분 ~30-60만원, 60분 ~60-120만원 | 디지털금융 자문 전문 |
| **법무법인 초월** | 김앤장 출신 변호사 공동 설립 (2024), AI 도입 차세대 로펌 | 30분 ~30-70만원, 60분 ~70-140만원 | AI 친화 + 김앤장 quality + 부띠크 비용 |

**사장님 권장 path (cost-effective)**:
- Step A 무료 자문 → Step B 시나리오 B/C trigger 시 → **법무법인 비컴** 또는 **법무법인 초월** 30분 booking (~30-70만원)
- 이 비용 영역은 vault 45 §1.5 "30-50만원" 예산 정합

#### 2.3 개별 변호사 (네트워크 + LinkedIn 검색 path)

- LinkedIn에서 "한국 핀테크 변호사" / "자본시장법 변호사" 검색 → 5-10년 경력 + 핀테크 스타트업 client 경험 보유 lawyer
- 1대1 consultation typically ~20-50만원/시간 (시장가)
- 단 *기관 reputation 약함* — Tier 2 유료 자문은 부띠크 또는 대형 로펌 권장

---

## 2. 자문 비용 budget plan

### 추천 budget allocation

| 시나리오 | Step A 비용 | Step B 비용 | Total | Timeline |
|---|---|---|---|---|
| 시나리오 A (무료 충분) | 0원 | 0원 | 0원 | 1-3주 |
| 시나리오 B (유료 verify 필요) | 0원 | 30-70만원 (부띠크 30분) | 30-70만원 | 2-4주 |
| 시나리오 C (대형 로펌 확인) | 0원 | 60-150만원 (대형 60분) | 60-150만원 | 3-5주 |

**사장님 예산**: vault 45 §1.5 "30-50만원" → 시나리오 A or B 영역 fit. 시나리오 C는 *escalation 시점* 영역.

### 비용 vs risk trade-off

- 무료 자문만 신뢰 후 launch = risk medium (lawyer 회신은 *general guidance*, *case-specific final 분류 책임 X*)
- 부띠크 유료 자문 추가 = risk low (case-specific 분석 + 의견서)
- 대형 로펌 자문 추가 = risk minimal (가장 권위 있음, 단 over-engineering 가능)

**사장님 권장**: Step A 무료 → 회신 결과 보고 Step B 부띠크 30분 *최소 영역 진행* (risk minimization + budget control balance).

---

## 3. 법무 자문 질의서 (draft — Korean professional tone)

> **이하 §3.1-3.6 본문은 사장님이 한국핀테크지원센터 신청 form에 paste하거나, 유료 자문 booking 시 advance 전달용 prep 문서**.

---

### 3.1 자문 요청 배경

안녕하세요, 저는 핀테크 스타트업 *Cohort (코호트)*를 준비 중인 운영자입니다. 본 service는 한국 sophisticated retail 투자자 (Top 5-10% 영역, 본인 plan을 가지고 매크로 indicator를 정기 watching하는 user)를 대상으로 다음 기능을 제공하는 **mobile-first PWA subscription service**입니다:

- **Tier 0 (무료)**: 한국은행 ECOS + FRED + DART 등 public API 기반 매크로 indicator dashboard + KOSPI/코스닥 heatmap + 일별 공시 list (15분 지연 data)
- **Tier 1 (무료 trial)**: Tier 0 + 1개 trigger alert + 5종목 watchlist 공시 alert + 1일 1회 sentiment digest
- **Tier 2 (Pro 24,900원/월)**: 50+ indicator real-time + custom widget + 분할매수 timing helper (사용자 watchlist + plan 기반 score 제공) + custom trigger alert (composite condition) + FOMO/panic 차단 nudge layer + **AI mascot chat (양방향 conversation)**
- **Tier 3 (Premium 79,900원/월)**: Tier 2 + 1:1 AI advisor + 거장 portfolio 분석

본 service는 **자본시장법 자문업 회피를 strict하게 design**했습니다:
- "추천 / 권장 / 비중 X% / 지금 매수" 등 표현 NEVER 사용
- 3-layer safety filter (regex pattern + Claude classifier + redirect template) 적용
- 모든 surface에 disclaimer 명시 ("본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문 서비스가 아닙니다")
- Bloomberg Terminal / Koyfin 같은 *information + tool* positioning (자문업 등록 X)

그러나 **2024년 8월 시행 자본시장법 개정** 관련해서 다음 질문을 자문 받고자 합니다.

---

### 3.2 질문 1 — 양방향 chat + 유료 회원제 분류

2024년 8월 개정 자본시장법에 따르면, **유사투자자문업은 "단방향 채널을 이용해 불특정다수에게 개별성 없는 조언"만 허용**되며, **SNS·오픈채팅방 등 온라인 양방향 채널을 통해 유료 회원제로 영업**하는 방식은 **투자자문업자로 규율**된다고 알고 있습니다.

Cohort의 Tier 2 (Pro 24,900원/월)에는 다음 양방향 기능이 있습니다:

- **AI mascot (Aurora/Vesper) in-app chat**: 사용자가 질문 input → Claude API base AI가 응답 output. Conversation thread 형식. 사용자의 watchlist + 매크로 컨텍스트 aware.
- **Custom trigger alert + follow-up**: 사용자가 trigger 조건 setup → 조건 도달 시 push alert → 사용자가 in-app에서 "왜 trigger가 발동했는가" 등 follow-up 가능

본 architecture는:
- **(a) 유사투자자문업 신고로 충분한가** (자본금 5,000만원 + 신고)?
- **(b) 또는 투자자문업 인가 의무 영역인가** (자기자본 5억원 + 임직원 자격 + 금융위 인가)?
- **(c) 또는 비자문업 (정보 제공업) 분류 가능한가**?

만약 (b) 영역이라면, **양방향 chat 기능 제거 시 (c) 또는 (a) 영역으로 downgrade 가능한가**?

---

### 3.3 질문 2 — Option B Framing의 법적 효력

저희 service는 architecture 전체에 걸쳐 **"추천 / 권장 / 자문" 표현 절대 사용 금지** 정책을 적용합니다. 모든 output는:
- "본인 plan 영역 다시 점검해보세요"
- "본인이 설정한 trigger 영역 도달 여부 확인해보세요"
- "본인 페이스로 결정하세요"

형식의 *user-decision-centric* framing으로 처리됩니다.

또한 모든 surface (dashboard, push notification, in-app chat, email)에 disclaimer 명시:

> "본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문 서비스가 아닙니다. 모든 투자 결정과 손익은 사용자 본인의 책임입니다."

질문:
- **(a) 이러한 framing이 substance over label 원칙 적용 시 어떻게 평가되는가**?
- **(b) 자문업 분류 회피 효과가 있는가, 아니면 substance (composite score 제공 + trigger alert + AI chat)만 판단되는가**?
- **(c) 만약 framing이 효력 약하다면, 어떤 추가 safeguard가 substance 영역 자문업 회피 효과를 강화하는가** (예: 사용자 동의 명시 + 정보 source 명시 + AI output 명시 등)?

---

### 3.4 질문 3 — 분할매수 Timing Helper (Shape B)의 개별성

Cohort의 Shape B (분할매수 Timing Helper)는 다음과 같이 작동합니다:

1. 사용자가 자신의 watchlist (최대 30종목) 등록
2. 사용자가 각 종목별 분할매수 plan input (총 비중, 분할 횟수, 시점)
3. 시스템이 매크로 score (Shape A 기반) + technical score (가격/거래량/RSI/MACD) + sentiment score (Claude API) weighted score 계산
4. Output: "timing recommendation (장열/마감 30분/오늘/내일/보류) + 비중 추천 (이번 회차 X% 매수 권장) + 3-5줄 rationale (Claude API)"

(*"권장" 표현은 product에서 "참조" 또는 "옵션" 등으로 re-framing 예정 — 단 substance는 동일*)

질문:
- **(a) 이러한 개별 사용자의 watchlist + plan 기반 output가 "개별성 있는 조언"으로 분류되는가**?
- **(b) "추천" → "참조" framing pivot이 substance 분류에 영향 주는가**?
- **(c) 만약 개별성 영역으로 분류되어 투자자문업 trigger된다면, architecture를 어떻게 re-design하면 회피 가능한가** (예: 사용자 input 받지 않고 *시장 전체 generic signal*만 제공)?

---

### 3.5 질문 4 — Architecture downgrade scenario 평가

본 service는 sprint 0 W3 build 진입 전 자문업 분류 risk를 minimize하는 architecture 결정 필요합니다. 다음 3가지 downgrade scenario 평가 요청:

**Scenario A — Full pivot to information-only**:
- AI mascot chat 완전 제거 → 일방향 dashboard + 일별 newsletter format only
- 분할매수 helper 제거 또는 *generic signal* (사용자 input X) 만 제공
- 분류 예상: 비자문업 또는 유사투자자문업 신고

**Scenario B — Delay chat to V2**:
- V1 launch = AI chat 없이 dashboard + alert only
- V2 (8주 PMF window 후, 또는 법무 prep 완료 후) chat 도입
- 분류 예상: V1 = 유사투자자문업, V2 시점 재평가

**Scenario C — Maintain current + insurance**:
- 양방향 chat + Pro tier + Shape B 모두 유지
- 강력한 disclaimer + 사용자 동의 + 전문직 배상책임 보험
- 분류 예상: 투자자문업 risk acknowledged, mitigation via documentation

각 scenario에 대해:
- **(a) 자본시장법 분류 (자문업/유사자문업/비자문업)**?
- **(b) 신고/인가 의무 발생 여부**?
- **(c) 운영자 관점에서 risk vs commercial viability balance 가장 좋은 path**?

---

### 3.6 질문 5 — 회신 형태 + 후속 action

회신 요청 사항:
- **(a) 5개 질문 각각에 대한 명시 회신 본문**
- **(b) 가능하다면 *서면 의견서 형태* (PDF 또는 email) — 향후 architecture 결정의 evidence base로 활용**
- **(c) 만약 추가 자문이 필요한 영역이 있다면 그 영역 명시** (예: 데이터 source 별 분류, KRW vs USD 영역, 영문 expansion 시점 GDPR 영역 등)
- **(d) 회신 lawyer의 전문 분야 + 경력 (Cohort 운영자가 향후 후속 자문 booking 시 참조)**

---

### 3.7 부속 자료 (자문 시 함께 제출)

(*사장님이 자문 신청 시 다음 자료를 attach 권장 — Cowork이 작성 가능*)

1. **Cohort architecture diagram** (Tier 0/1/2/3 + Shape A/B/C + 양방향 chat 영역 highlight) — 1 page summary
2. **샘플 user flow 영상 또는 screenshot** (Aurora chat 예시 + Shape B output 예시 + safety filter 작동 예시) — 자문 lawyer가 substance 직접 evaluate 가능
3. **현재 disclaimer + framing language 전문** (vault 14 §14.4-pre 참조)
4. **본 file (vault 45 audit + vault 14 §14)** — 자문 lawyer가 context 빠르게 grasp

Cowork이 사장님 confirm 시 이 부속 자료 4종을 1-2 turn 내 작성 가능합니다.

---

## 4. 회신 evaluation framework — 사장님이 회신 받은 후 사용

회신 받은 후 다음 framework로 평가:

### 4.1 회신 substance check

- [ ] 5개 질문 모두 명시 회신했는가?
- [ ] (b) 투자자문업 인가 의무 영역인가? — 명확한 답변 (YES/NO/AMBIGUOUS)
- [ ] Substance over label 원칙 적용 결과 명시되었는가?
- [ ] Downgrade scenario 3가지 평가 명시되었는가?
- [ ] 의견서 형태로 회신 받았는가? (향후 evidence base)

### 4.2 회신 verdict matrix

| 회신 verdict | Architecture path | Cowork 후속 action |
|---|---|---|
| **자문업 인가 의무 (Option B 효력 X)** | Scenario A — Full pivot to information-only | vault 14 §14 architecture re-design (3-5 turn) + vault 38 brand impact 검토 |
| **유사투자자문업 신고로 충분 (양방향 chat + Pro OK)** | Current architecture maintain + 신고 진행 | vault 22-compliance-review-prep 영역 신고 prep + Sprint 0 W3 build 진입 OK |
| **Ambiguous / case-by-case** | Scenario B — V1 chat defer + V2 prep | vault 26 W2-W5 build plan 영역 chat 제외 update + Sprint 0 build 진입 |
| **비자문업 (정보 제공업) 분류 가능** | Current architecture maintain + 신고 불필요 | Sprint 0 W3 build 진입 즉시 + disclaimer 강화만 진행 |

### 4.3 Step B 유료 자문 trigger 결정

다음 조건 1개 이상 시 Step B 유료 자문 booking 권장:

- [ ] 무료 회신이 ambiguous (e.g., "case-by-case 판단" 또는 "추가 자문 필요")
- [ ] 무료 회신이 "투자자문업 인가 의무" verdict (확인 영역 + architecture re-design path 정밀화 필요)
- [ ] 무료 회신 lawyer 전문 분야가 핀테크/자본시장법 *직접 fit X* (예: 일반 회사법 lawyer 배정 시)
- [ ] 운영자 본인 *evidence quality에 대한 confidence 영역* 추가 verify 영역

---

## 5. 사장님 자체 결정 영역 (Cowork 입장 X)

본 자문 결과 받은 후 다음 결정은 운영자 voice 영역:

| 결정 | Cowork capacity | 운영자 voice 영역 |
|---|---|---|
| Architecture path 선택 (Scenario A/B/C 중) | technical re-design draft 작성 capacity | 최종 path 결정 |
| 유사투자자문업 신고 진행 여부 | 신고 form prep 영역 capacity | 진행/defer 결정 |
| 5억 자본금 raise (Option B 강제 시) | VC research / 사업 계획서 prep capacity | raise/sunset/pivot 결정 |
| Sprint 0 W3 build 진입 timing | technical readiness check capacity | go/no-go 결정 |
| 보험 가입 (전문직 배상책임) | 보험사 후보 research capacity | 가입 여부 결정 |

---

## 6. Timeline integration — Sprint 0 W2-W3 plan

```
지금 (2026-05-24, W2 mini-checkpoint) 
  ├─→ 사장님 personal network 3명 walkthrough (Step 2-3, 1-2주)
  └─→ Step A 무료 자문 신청 (5분, 본 file §3 질의서 paste)
       │
       │ 1-3주 회신 대기 (parallel with walkthrough)
       │
       ▼
W2 walkthrough 완료 + 무료 자문 회신 받음
  │
  ├─→ §4 verdict matrix 따라 path 결정
  │
  ├─→ Scenario A/B 시 → Step B 유료 자문 booking (1-2주 추가)
  │     │
  │     ▼
  │   Step B 회신 → final architecture path 결정
  │
  └─→ Scenario maintain 시 → Sprint 0 W3 build start 즉시
       │
       ▼
W3 build start
```

**최악 timeline**: 무료 자문 3주 + 유료 자문 2주 = **5주 lag**. 단 Sprint 0 W3 = current W2 + 1주 = **2026-06-01 (W3 start target)**. Gap 발생 시 **무료 자문 회신 대기 중에도 W3 architecture-agnostic build** (Tier 0 dashboard + 매크로 indicator 영역 — chat/Shape B 영역 외) 진행 가능.

**Cowork 권장**: Step A 무료 자문 신청은 **오늘 (2026-05-24) 진행** — walkthrough와 parallel. 회신 대기 중 W3 build의 *architecture-agnostic 영역* (Tier 0 + Shape A indicator) 시작. Chat/Shape B 영역 build는 회신 후 trigger.

---

## 7. 사장님 진행 checklist

본 file 받은 직후:

- [ ] 1. 한국핀테크지원센터 sandbox.fintech.or.kr 접속
- [ ] 2. 법률 컨설팅 신청 form 열기
- [ ] 3. 본 file §3 (질의서 §3.1-3.6) 본문 paste
- [ ] 4. 부속 자료 attach 필요 시 Cowork에 요청 ("부속 자료 4종 prep 부탁")
- [ ] 5. 신청 submit
- [ ] 6. 회신 대기 (1-3주, parallel with W2 walkthrough)
- [ ] 7. 회신 받은 후 §4 verdict matrix 따라 평가
- [ ] 8. Step B 유료 자문 booking 결정 (필요 시)
- [ ] 9. Cowork에 회신 결과 share → architecture path 결정 진행

---

## 8. Cowork 후속 capacity

본 file 진행 결과에 따라 다음 작업 Cowork가 진행 가능:

| Trigger | Cowork 작업 | Estimated effort |
|---|---|---|
| 사장님 "부속 자료 4종 prep 부탁" | Architecture diagram + user flow screenshot + disclaimer 전문 + context summary 작성 | 1-2 turn |
| 무료 자문 회신 = "ambiguous" 시 | 유료 부띠크 booking script + 후속 질의서 refinement | 1 turn |
| 무료 회신 = "Scenario A 필요" 시 | vault 14 §14 architecture re-design draft (chat 제거 + Shape B generic signal pivot) | 2-3 turn |
| 무료 회신 = "유사투자자문업 신고로 충분" 시 | 유사투자자문업 신고 form prep + vault 22-compliance update | 1-2 turn |
| Step B 유료 자문 회신 received 시 | Final verdict integration + Sprint 0 W3 build start trigger 평가 | 1 turn |

---

## 9. 사장님 self-commitment 권장 (vault 45 §8.2 정합)

본 Gate 1 prep 진행 시 다음 self-commitment 권장 (별도 메모 또는 vault 31-tracker에 record):

> **Gate 1 결과에 따른 사전 commitment**:
> - 무료 자문 회신이 "투자자문업 인가 의무" verdict이면 → architecture re-design 진행 (sunk cost bias 회피)
> - 5억 자본금 unable 시 → Scenario A (chat 제거 + 정보 제공 only) 또는 Cohort sunset 결정
> - Sprint 0 W3 build 시작 전 반드시 verdict 확정 (regardless of 무료/유료) — 우선순위 1
> - 결과가 부정적이어도 *Cohort sunset이 honest exit*. 8-round naming process처럼 명시 evidence base에 따른 결정.

이 commitment record는 anti-pattern #13 (sunk cost) + anti-pattern #14a (goalpost shift) 회피 핵심.

---

## 10. 본 file metadata

- **File**: `~/Development/cohort/46-legal-consultation-prep-2026-05-24.md`
- **Trigger**: vault 45 §1 RED FLAG #1
- **Author**: Cowork (Level 10 founder persona Gate 1 deliverable)
- **Operator next step**: Step A 무료 자문 신청 (5분, 0원)
- **Cowork standby**: 부속 자료 4종 prep / 후속 capacity §8 trigger 대기
- **Vault cascade**: vault 22-compliance-review-prep + vault 31-tracker §1.5 (회신 후 update)

---

## Sources

- [한국핀테크지원센터 (sandbox.fintech.or.kr) — 무료 법률 자문 신청](https://fintech.or.kr/)
- [한국핀테크지원센터 — 기관정보 (THE VC)](https://thevc.kr/fintechcenterkorea)
- [Who's Who Legal Korea 2025 — 증권·금융 (리걸타임즈)](https://www.legaltimes.co.kr/news/articleView.html?idxno=89093)
- [김·장 법률사무소 — 핀테크 전문](https://www.kimchang.com/ko/expertise/detail.kc?idx=219)
- [법무법인 비컴 — 핀테크 전문 부띠크](https://becomelaw.com/fintech)
- [차앤권 법률사무소 — 핀테크/스타트업 전문](https://chakwon.com/dh/solution_blockchain?cate_idx=87)
- [법무법인 화우 디지털금융센터](https://www.hwawoo.com/kor/solutions/sector/299)
- [법무법인 초월 — AI 도입 차세대 로펌 (네이트 뉴스)](https://news.nate.com/view/20241004n13343)
- [25년 4분기 혁신금융서비스 지정 정기신청 개시 (금융위원회)](https://fsc.go.kr/po010101/85840)
- [2025 법무법인 순위 (kimsfactory 블로그)](https://blog.kimsfactory.com/entry/10996)
