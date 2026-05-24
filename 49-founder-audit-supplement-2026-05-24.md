# Cohort — Founder Audit Supplement (vault 45 보강)

> **Trigger**: vault 45 audit Gate 1 deliverable 완료 후 사장님 요청 "추가적으로 피드백 해야 하는 것들을 진행"
> **Date**: 2026-05-24 (Sprint 0 W2 mini-checkpoint 시점)
> **Scope**: vault 45 audit에서 *명시했지만 spec 부족했던 3 영역* 보강
> **Status**: Operator review 권장 — 3 영역 모두 W2 walkthrough 전 또는 W3 build 진입 시점에 implement

---

## 0. 본 supplement의 위치

vault 45 audit가 *전체 strategic verdict + 5 Gate*를 명시했다면, 본 supplement는 다음 3 영역의 *operational spec*을 보강:

| # | 영역 | vault 45 reference | supplement scope |
|---|---|---|---|
| 1 | Sunk cost commitment mechanism | vault 45 §8.2 + §11 | 자문 verdict 받기 *전* 명시 commit + commitment record file template |
| 2 | W2 walkthrough evaluation framework | vault 45 §9.1-9.3 + W2 demo script | Cluster B sub-cluster classification + verdict synthesis criteria + 통계적 sample bias mitigation |
| 3 | 8-week cashflow checkpoint metrics | vault 45 §8.3 | PostHog event spec + leading indicator dashboard + automated sunset trigger alert |

각 영역은 *W3 build start 전 또는 W3 build 시점*에 implement 가능한 형태로 spec.

---

## 1. Supplement #1 — Sunk cost commitment mechanism (vault 45 §8.2 보강)

### 1.1 문제 정의 — vault 45가 명시했지만 약했던 영역

vault 45 §8.2:
> *"사장님 사전 commitment 의무 권장 (anti-pattern #14a goalpost shift + #13 sunk cost 회피)"*

vault 45 §11:
> *"운영자는 자문 결과에 따라 architecture re-design 또는 honest sunset commit 사전 명시 (anti-pattern #13 sunk cost mitigation)"*

**vault 45가 부족했던 부분**:
- *commit 명시 record file이 어디 어떻게 작성되는지 spec 없음*
- *commit 위반 시 trigger 또는 enforcement mechanism 없음*
- *commit 작성 시점 (자문 신청 *전* vs 회신 *대기 중* vs 회신 *후*) 명시 X*

**Specific risk**: Sprint 0 Day 11 시점에 *5주 build sunk cost* (vault 14 §14 architecture + Aurora chat scaffold + safety filter 3-layer + onboarding consent + landing copy + Day 11 commit 309f6ca)가 *이미 누적됨*. 자문 verdict이 "Scenario A — chat 제거 + 단방향 narration only"일 때, 운영자의 cognitive bias가 다음 패턴으로 작동 위험:

1. *"이미 5주 작업했는데 chat을 제거하면 너무 큰 회귀"* (sunk cost framing)
2. *"lawyer가 case-by-case 판단이라고 했으니 risk acknowledge하고 진행"* (ambiguity exploit)
3. *"Tier 0 anonymous chat은 무료니까 자본시장법 적용 안 됨"* (literal reading)
4. *"Polar checkout이 미국 entity (MoR)니까 한국 자본시장법 영역 외"* (jurisdiction wishful thinking)

각 패턴이 anti-pattern #13 (sunk cost) + #14a (goalpost shift)의 *구체적 manifestation*.

### 1.2 권장 mechanism — Pre-verdict Commitment Record (PCR) file

**File path**: `~/Development/cohort/PCR-2026-05-24-legal-verdict-commitment.md`

**작성 시점**: **자문 신청 form submit 직후, 회신 받기 *전*** (가장 중요 — 회신 받은 후 emotional reaction에 의한 backwards-rationalization 차단)

**Template** (사장님이 본인 voice로 채워서 작성):

```markdown
# Pre-Verdict Commitment Record (PCR)

> **자문 회신 받기 전 명시 commitment**
> 작성 시점: 2026-05-XX (자문 form submit 직후)
> 운영자: 조윤환 (Plancy)

## 0. Context

자문 신청 시점에 Cohort는 다음 상태:
- Sprint 0 Day 11 ship (commit 309f6ca)
- Aurora chat scaffold 완료 (bidirectional safety filter live)
- vault 14 §14 architecture lock-in
- 누적 작업 시간: ~5주 + 운영자 personal time
- vault 45 audit RED FLAG #1 (2024년 8월 자본시장법 개정) 인지

## 1. 자문 verdict별 사전 commit action

회신 verdict이 다음 카테고리에 해당할 때, 운영자는 다음 action을 *결과 받은 후 emotional reaction에 영향 받지 않고 진행*:

### 1.1 Verdict A — "투자자문업 의무 X, 유사투자자문업 신고로 충분 또는 비자문업 분류"
**Commit**: W3 build 즉시 진행. Sprint 0 W5 launch target 유지. 유사투자자문업 신고 (5,000만 자본금 + 신고서) 진행.

### 1.2 Verdict B — "투자자문업 인가 의무 (5억 자본금) + 운영자 자력 가능"
**Commit**: 자기자본 5억 raise 또는 personal asset injection. 투자자문업 인가 신청 6개월+ parallel + W3 build 영역 advisory feature 제외 limited launch.
**Sub-commit**: 자력 raise 어려우면 Verdict C 영역으로 escalate.

### 1.3 Verdict C — "투자자문업 의무 + 5억 raise 불가" (가장 critical 영역)
**Commit**: **Architecture re-design 즉시 진행**. 다음 중 sang-nim 결정:
- Scenario A: Aurora chat 제거 + 단방향 narration only + 유사투자자문업 신고
- Scenario B: chat 유지 + 모든 paid tier 제거 (전체 무료, donation 모델)
- Scenario C: Cohort honest sunset + Phase 1 next product 또는 외주 회사 focus

**중요**: 위 3 scenario 중 어느 것도 *"chat을 약간만 제거" 또는 "Pro tier 가격 인하" 같은 incremental fix는 commit X*. 이유: 그건 substance 변경 없음 → lawyer 회신을 회피하는 anti-pattern #13.

### 1.4 Verdict D — "ambiguous, case-by-case 추가 review 필요"
**Commit**: Step B 유료 자문 trigger (법무법인 비컴 또는 초월, 예산 30-50만원). **W3 build 진입 X** (Step B 회신까지 build pause). 1-2주 추가 시간 budget.

### 1.5 Verdict E — "honest sunset trigger" (re-design 불가 + 인가 불가 + 영문 expansion fit X)
**Commit**: Cohort honest sunset. vault 28 같은 deprecated archive 영역. Phase 1 next product pivot (Cluster B 외 영역 또는 Cluster B re-positioning).
**Sub-commit**: Sunset 결정은 *Day 11 시점 sunk cost 5주 작업*에 영향 받지 X. vault 28-mascot-joon 처럼 *명시 evidence-based abandon* 역사 보존.

## 2. Commit 위반 시 self-correction trigger

만약 회신 받은 후 운영자 본인이 위 commit과 다른 path 진행 충동 발생 시:

- [ ] Trigger 1 — *"chat을 약간 제거 또는 disclaimer 강화로 충분"* 사고 발생 시 → **이 PCR file 재읽기 + anti-pattern #13 명시 reference**
- [ ] Trigger 2 — *"lawyer 회신이 보수적 해석일 가능성, 다른 lawyer 자문 받자"* 사고 발생 시 → **Step B 유료 자문 1회만 허용, 2회 이상은 anti-pattern #14a goalpost shift**
- [ ] Trigger 3 — *"Tier 0 anonymous chat은 자본시장법 적용 X 가능"* 사고 발생 시 → **substance over label 원칙 inversion attempt 자체가 anti-pattern**
- [ ] Trigger 4 — *"Polar checkout MoR이라 한국 자본시장법 외"* 사고 발생 시 → **사용자 거주지 한국 + 서비스 운영 한국 = 한국 자본시장법 적용**
- [ ] Trigger 5 — *"5주 작업 sunk cost 회피"* 사고 발생 시 → **anti-pattern #13 literal manifestation, vault 45 §11 reference**

## 3. 자문 회신 received 시점 protocol

회신 received 후 다음 protocol 의무 진행:

1. **24시간 cool-off period** — 회신 본문을 한 번 읽고 즉시 결정 X. 24시간 동안 normal life routine 유지.
2. **본 PCR file 재읽기** — 회신 verdict이 어느 카테고리에 해당하는지 식별
3. **Cowork share** — Cowork이 verdict synthesis + path recommendation 제공 (단 *결정은 운영자 voice*)
4. **결정 record** — 본 PCR file 하단에 *결정 본문 + 결정 시점 + 결정 근거* 명시 record (vault cascade)
5. **Action trigger** — commit action 진행 (Verdict A/B/C/D/E 따라)

## 4. 본 PCR 작성 시점 본인 mental state record

(*사장님이 자문 submit 직후 본인 voice로 작성*):

- 현재 Cohort에 대한 honest assessment: [작성]
- 5주 작업 sunk cost feeling 강도 (1-10): [작성]
- 회신 verdict이 negative일 가능성 expected: [작성]
- 만약 Cohort sunset이라면 next 영역 후보: [작성]
- 본 PCR 작성한 self-trust level (1-10): [작성]

---

## Update log

- 2026-05-XX: PCR 작성 (자문 form submit 직후)
- 2026-XX-XX: 자문 회신 received → §3 protocol 진행
- 2026-XX-XX: Action 결정 + record

```

### 1.3 PCR file의 가치 — anti-pattern psychology 측면

**왜 written commitment가 mental commitment보다 강한가**:
- 운영자가 *future self*에게 *current self*가 보낸 letter 형식
- 회신 받은 후 emotional reaction (긍정/부정/실망/안도 등)이 *current self*의 reasoning을 dominate할 위험
- *Past self의 명시 voice*가 *future self가 backwards-rationalize하기 어려운 evidence*로 작동

**Behavioral economics reference**:
- Ulysses contract (Odyssey, Sirens 영역) — 미래 self가 약해질 것을 알고 *현재 self*가 *future self의 옵션을 제한*
- Pre-commitment device (Schelling, 1980s) — 명시 commitment가 *time-inconsistent preference* 회피
- Ulysses contract의 *clinical analog* = 정신과 환자가 *manic episode 전*에 *manic episode 시점의 자기 결정을 무시*하기로 사전 동의 (의료법 영역)

Cohort 같은 *5주 sunk cost가 누적된 product*는 정확히 *time-inconsistent preference 위험 영역*. 본 PCR가 그 risk mitigation.

### 1.4 사장님 즉시 action

PCR 작성:
1. 위 §1.2 template을 ~/Development/cohort/PCR-2026-05-24-legal-verdict-commitment.md 로 복사
2. §1.4 "본인 mental state record" 본인 voice로 작성
3. §1.1-1.3 *vault 45 verdict matrix와 정합 verify* (이미 정합)
4. *자문 form submit 직후 또는 직전*에 record
5. Git commit (vault cascade evidence — *backwards-edit 어렵게*)

만약 사장님이 본 PCR template의 명시 voice가 *현재 commit과 다름* 발견 시 — *그 발견 자체*가 PCR의 가치 (current voice가 future를 잘못 lock-in하기 전 alignment 영역).

---

## 2. Supplement #2 — W2 walkthrough evaluation framework strengthening (vault 45 §9.1-9.3 보강)

### 2.1 vault 45가 명시했지만 부족했던 영역

vault 45 §9.1 (사전 commitment template):
- 3/3, 2/3, 1/3, 0/3 verdict scenario 4개
- Mascot dual/single verdict (§9.1)
- Behavioral guard primary value verdict (§9.1)

**부족했던 부분**:
- *Cluster B sub-cluster classification framework 없음* — 3명이 각각 B.1.a / B.1.b / B.1.c 어디에 속하는지 명시 X. Cluster A subset 1명 포함 시 결과 distortion 위험.
- *Verdict synthesis criteria 약함* — 3명 verdict이 mixed일 때 (1 YES + 1 PARTIAL + 1 NO 등) 의사결정 framework 명시 X.
- *Sample bias mitigation framework 없음* — personal network 3명 = 사장님과 가까운 자가 *negative signal 약함*. Honest feedback 확보 mechanism 없음.

### 2.2 보강 framework — Pre-Walkthrough Classification (PWC)

각 walkthrough 진행 *전*에 다음 classification 진행:

#### 2.2.1 Cluster B sub-cluster fit 측정

| Dimension | B.1.a Sophisticated Disciplined | B.1.b Time-Constrained Emotional | B.1.c English-Native Cross-cultural |
|---|---|---|---|
| Portfolio bucket | 1억-5억+ | 5천만-2억 | 1억+ (USD or KRW) |
| 매크로 watching 빈도 | 매일 30분-1시간 | 주 1-3회 (시간 제약) | 매일 (영문 source 친숙) |
| 자체 plan 형식화 정도 | excel sheet + 분할매수 schedule 명시 | 머릿속 또는 broad rule | excel + factor model 정밀 |
| 과거 panic sell / FOMO buy 경험 | 적음 (disciplined) | **있음, 핵심 pain point** | 적음 (cross-cultural perspective) |
| 결제 의향 strength | 중간 (self-sufficient) | **높음 (behavioral guard 가치)** | 중간 (Koyfin 등 영문 alternative) |
| V1 launch primary target | secondary | **primary** | defer to Sprint 1+ |

**Cohort V1 PMF target = B.1.b primary** (vault 45 §5.4 + §2.4 정합).

각 walkthrough 진행 *전* 사장님이 3명을 다음 quadrant에 명시 record:

```
P1: [Name] → Sub-cluster: [B.1.a / B.1.b / B.1.c / Cluster A subset / Cluster B 외]
   Portfolio bucket: [수치]
   매크로 watching 빈도: []
   자체 plan 형식화: []
   Panic/FOMO 경험: [있음/없음, 사장님 알고 있는 영역]
   Cluster B fit score (1-10): []

P2: ...
P3: ...
```

**의미**: B.1.b primary가 3명 중 0명이면 → walkthrough 결과가 *PMF target signal X* (다른 sub-cluster signal). B.1.b가 1명+ 있으면 → 그 1명의 verbatim quote가 *가장 high-value evidence*.

#### 2.2.2 Honest feedback friction 측정

3명 각자에 대해 다음 questions:

| Question | 답변 |
|---|---|
| 사장님과의 관계 거리 (1-10, 1=동거인 가까움, 10=처음 만남) | [] |
| 본인이 "Cohort = useful X" 솔직 말할 expected likelihood (1-10) | [] |
| 본인이 사장님 product의 직접 negative criticism 경험 (Y/N) | [] |
| 본인이 사장님 expertise를 trust하여 *deference* 가능성 (1-10) | [] |
| Walkthrough 결과가 사장님 work에 영향 줄 *moral responsibility* feeling (1-10) | [] |

**해석**:
- 거리 1-3 (가까움) + deference 7+ + moral responsibility 7+ → **honest feedback friction HIGH**. Verdict weight 조정 (NO weight 1.5x, YES weight 0.7x).
- 거리 7+ + deference 3- + moral responsibility 3- → **honest feedback friction LOW**. Verdict weight as-is.

**의미**: vault 45 §9.1 scenario 3/3 YES verdict이 *honest feedback friction HIGH 3명 모두에게서 나왔다면* → false positive 가능성 강함. Behavioral guard primary value question (vault 45 §9.2) 답변을 추가 weight.

#### 2.2.3 Verdict synthesis criteria (vault 45 §9.1 보강)

| Pattern | Synthesis verdict |
|---|---|
| 3/3 YES + honest feedback friction LOW | **STRONG YES** — W3 build 즉시 진행 |
| 3/3 YES + honest feedback friction HIGH | **WEAK YES + 추가 검증 권장** — 1명 추가 honest feedback (Cluster B target + 사장님 모르는 사람) 권장 |
| 2/3 YES + honest feedback friction LOW + B.1.b 1명+ | **YES with conditions** — B.1.b user의 specific concern 영역 W3 build에서 address |
| 2/3 YES + honest feedback friction HIGH | **AMBIGUOUS** — Additional walkthrough (Cluster B target + 사장님 모르는 사람 1-2명) 권장 |
| 1/3 YES + 2/3 mixed | **WEAK SIGNAL** — Positioning pivot (vault 45 Gate 2) 우선 진행 후 재검증 |
| 0/3 YES | **NEGATIVE SIGNAL** — Cohort positioning 또는 product 자체 fundamental issue. vault 45 §7.2 verdict matrix에서 RECONSIDER 영역 진입 |
| 0/3 YES + B.1.b 0명 | **DEFER VERDICT** — Sample mismatch, 다른 walkthrough 진행 필요 |

#### 2.2.4 Verbatim quote 추가 dimension

vault 45 §9.2 core question 3개에 추가로:

**5분 자유 사용 후 verbatim 측정 question**:
- "이 service를 1주일 동안 사용한다면, 어떤 routine에서 사용할 것 같아요?"
- "이 service에 매월 25,000원을 지불할 의향은 어떠세요? (sincere answer)"
- "본인이 panic sell 또는 FOMO buy 한 경험이 있다면, 그 순간을 다시 산다면 이 service가 useful했을 거라고 생각해요?"

**verbatim quote 보관 의무**:
- 답변 paraphrase X, *원어 그대로 record*
- 답변 hesitation, qualifier ("어... 글쎄요... 한번 써봐야"), tone shift 모두 record
- 답변 후 *사장님 reaction* (말 끊기, 부연 설명 추가) 회피 의무 — *사용자가 본인 voice로 말 끝낼 시간 보장*

### 2.3 사장님 즉시 action

1. W2 walkthrough 진행 *전*에 본 §2.2.1-2.2.2 framework로 3명 classification record
2. Walkthrough 진행 *후*에 §2.2.3 synthesis criteria로 verdict 결정
3. 결과를 Cowork share → Cowork이 vault 45 §9 verdict + Gate 2 pivot 통합 path recommendation

**Cowork capacity**: 사장님 결과 share 시 1 turn 내 synthesis + recommendation 진행.

---

## 3. Supplement #3 — 8-week cashflow checkpoint PostHog event spec (vault 45 §8.3 보강)

### 3.1 vault 45가 명시했지만 부족했던 영역

vault 45 §8.3:
> *"PostHog event spec for leading indicators (trial signup + DAU + Aurora chat session + push open rate + churn curve)"*

**부족했던 부분**: PostHog event 구체 spec 없음 — W3 build 시점에 implement 가능한 form X.

### 3.2 보강 spec — Cohort PostHog Event Schema v1

**Implementation timing**: Sprint 0 W3 build 시점 (Aurora chat extend + Shape A indicator extended 작업과 함께).

**Event taxonomy**:

#### 3.2.1 Funnel events (top-of-funnel → conversion)

| Event name | Trigger | Properties | Used for |
|---|---|---|---|
| `landing_view` | 사용자가 `/` 접속 | `referrer`, `utm_source`, `device_type`, `viewport` | Top-of-funnel volume |
| `dashboard_view` | 사용자가 `/dashboard` 접속 | `session_id` (anonymous), `is_first_visit`, `referrer` | Tier 0 anonymous engagement |
| `dashboard_indicator_click` | 사용자가 indicator card click | `indicator_code`, `session_id`, `time_since_landing` | Engagement depth |
| `aurora_chat_open` | Aurora chat bubble click | `session_id`, `tier` (anonymous/free/pro/premium), `time_since_landing` | Chat engagement rate |
| `aurora_chat_message_sent` | 사용자 message 전송 | `session_id`, `tier`, `message_length`, `turn_index` | Chat session depth |
| `aurora_chat_safety_filter_triggered` | Layer 1/2/3 trigger | `layer` (1/2/3), `pattern_matched`, `redirect_template_shown`, `session_id` | Safety filter effectiveness |
| `waitlist_submit` | 사용자가 email submit | `email_domain`, `session_id`, `referrer` | Conversion event |
| `signup_complete` | 회원가입 완료 | `user_id`, `consent_pipa`, `consent_marketing`, `consent_capital_market_law_disclaimer` | Tier 1 conversion |
| `trial_start` | 사용자가 Tier 2 trial 시작 | `user_id`, `tier_target` (pro/premium), `trial_days` | Trial conversion |
| `subscription_create` | Polar checkout 완료 | `user_id`, `tier`, `amount_usd`, `billing_interval` | Paying user conversion |
| `subscription_churn` | 구독 취소 | `user_id`, `tier`, `days_since_signup`, `cancellation_reason` (if collected) | Churn analysis |

#### 3.2.2 Retention events (DAU + engagement)

| Event name | Trigger | Properties |
|---|---|---|
| `user_active_day` | 사용자 daily session (first event of the day) | `user_id`, `tier`, `days_since_signup` |
| `aurora_morning_brief_view` | Aurora morning brief card view | `user_id`, `tier`, `time_of_day` |
| `aurora_chat_multi_turn` | Chat session 3+ turns | `user_id`, `tier`, `total_turns`, `total_session_duration_sec` |
| `shape_b_plan_create` | 사용자 분할매수 plan 작성 | `user_id`, `ticker`, `total_target_weight`, `split_count` |
| `shape_b_helper_used` | 사용자 helper output view | `user_id`, `ticker`, `composite_score`, `helper_recommendation_category` |
| `shape_c_trigger_create` | 사용자 trigger 설정 | `user_id`, `trigger_type`, `cooldown_hours` |
| `shape_c_trigger_fired` | trigger 도달 + alert sent | `user_id`, `trigger_id`, `cooldown_active`, `nudge_applied` |
| `shape_c_nudge_clicked` | 사용자 nudge engagement | `user_id`, `nudge_type` (FOMO/panic), `action_taken` (wait/proceed/dismiss) |
| `push_notification_sent` | Push delivery | `user_id`, `tier`, `notification_type` (morning_brief/trigger/nudge) |
| `push_notification_open` | 사용자 push click | `user_id`, `notification_id`, `time_to_open_min` |

#### 3.2.3 Critical safety + compliance events

| Event name | Trigger | Properties |
|---|---|---|
| `safety_filter_advisory_blocked` | Aurora chat에서 advisory request catch + redirect | `user_id` (or session_id), `original_message_hash` (PII-safe), `layer` (1/2/3), `category` (ADVISORY_REQUEST etc) |
| `safety_filter_false_positive_reported` | 사용자가 redirect를 "잘못된 차단" report | `user_id`, `original_message_hash`, `redirect_id` |
| `output_post_generation_check_triggered` | Aurora/Vesper output에서 forbidden phrase leak catch | `user_id`, `phrase_matched`, `replaced_with_redirect` |
| `disclaimer_view` | Onboarding consent modal에서 자본시장법 disclaimer view | `user_id`, `consent_given_at` |
| `data_deletion_request` | 사용자가 데이터 즉시 삭제 request | `user_id`, `deleted_at`, `days_since_signup` |

이 영역이 vault 14 §14.4 safety filter + 자본시장법 §14.4-pre disclaimer의 *measurable evidence* 영역. 자문 회신 + W3 build 시점에 *legal counsel에게 "filter가 실제 작동했다"는 evidence*로 활용 가능.

### 3.3 Leading Indicator Dashboard — sang-nim 일별 check

PostHog dashboard 1개 setup:

**Pre-launch (Sprint 0 W5 launch 전)**:
- Funnel volume (waitlist signup count daily)
- 사장님 본인 user testing volume (separated by user_id 운영자 본인)

**Post-launch Week 1-2**:
- DAU (overall + by tier)
- Trial signup rate (waitlist → trial conversion %)
- Aurora chat engagement rate (DAU 중 chat session 1+ %)
- Safety filter trigger rate (chat session 중 advisory_blocked %)
- Push notification open rate

**Post-launch Week 3-8**:
- Trial → Paid conversion rate (target: 5-15%)
- Paying user count (target threshold: 40+ at week 8)
- Week 1 / Week 4 retention curve
- Subscription churn rate (target: < 10%/month initial)
- ARPU (avg revenue per user)

### 3.4 자동 sunset trigger alert (옵션)

PostHog alerts setup:
- Daily check at 9am KST: `paying_user_count` query
- If `paying_user_count < threshold_for_current_week` → Slack/email alert 사장님
- Week 1: < 5 paying user → alert
- Week 4: < 15 paying user → alert
- Week 8: < 30 paying user → **SUNSET REVIEW alert** (vault 45 §8.1 < 10 threshold escalation)

**Implementation**: PostHog → Insights → Alert subscriptions feature 사용.

### 3.5 사장님 즉시 action

W3 build 시점:
1. PostHog account setup verify (Sprint 0 W1 영역 진행 완료 가정)
2. 본 §3.2.1-3.2.3 event spec을 cohort/src/lib/analytics/posthog.ts 영역에 implement
3. Dashboard setup (§3.3)
4. Alert setup (§3.4, 옵션)

**Cowork capacity**: 사장님 trigger 시 PostHog implementation code draft 1-2 turn 내 제공.

---

## 4. Cross-supplement integration timeline

```
[지금 2026-05-24]
   │
   ├── PCR (Supplement #1) 작성 → 자문 form submit과 함께
   ├── PWC (Supplement #2) 작성 → W2 walkthrough 진행 전
   │
[자문 form submit (이번 주)]
   │
   ├── PWC 따라 walkthrough 3명 진행 (1-2주)
   ├── PostHog event spec (Supplement #3) W3 build 영역 prep
   │
[자문 회신 received (1-3주 후) + walkthrough 완료]
   │
   ├── PCR 따라 verdict response 진행 (24시간 cool-off + 결정)
   ├── PWC 따라 walkthrough verdict synthesis
   │
[joint verdict + W3 path 결정]
   │
   ├── PostHog event implementation (W3 build 시점)
   └── 8-week cashflow checkpoint 준비
```

---

## 5. 본 supplement의 vault cascade

본 supplement는 vault 45 audit과 정합:

| Supplement section | vault 45 reference | Update path |
|---|---|---|
| §1 PCR | vault 45 §8.2 (사전 commitment) + §11 (sunset commit) | vault 45 §11 closing thought 강화 |
| §2 PWC | vault 45 §9.1-9.3 (W2 walkthrough demo script) | vault 45 §9.4 신규 section 추가 (walkthrough classification + sample bias mitigation) |
| §3 PostHog spec | vault 45 §8.3 (leading indicators) | vault 45 §8.4 신규 section 추가 (PostHog event schema) |

향후 cascade:
- vault 26 (W2-W5 implementation spec) 영역 — PostHog event spec inject
- vault 31-tracker §1.5 — PCR commit record 추가
- vault 22-compliance-review-prep — safety filter event evidence 영역

---

## 6. Cowork 후속 capacity

본 supplement 받은 후 사장님 trigger 시 Cowork 진행 가능:

| Trigger | Cowork 작업 | Effort |
|---|---|---|
| 사장님 "PCR file 작성 진행" | §1.2 template을 PCR-2026-05-XX file로 cohort 영역 작성 + Git commit ready | 1 turn |
| 사장님 "PWC framework로 3명 classification 진행" | 사장님이 명시한 3명 정보로 §2.2.1-2.2.2 classification synthesis | 1 turn |
| 사장님 "Walkthrough 완료 + 결과 share" | §2.2.3 synthesis criteria + vault 45 §9 verdict matrix 통합 path | 1-2 turn |
| 사장님 "PostHog event spec implement 진행" | §3.2 event를 cohort/src/lib/analytics/posthog.ts code draft | 2-3 turn |
| 사장님 "leading indicator dashboard setup" | PostHog dashboard config + alert spec | 1-2 turn |

---

## 7. File metadata

- **File**: `~/Development/cohort/49-founder-audit-supplement-2026-05-24.md`
- **Trigger**: 사장님 요청 "추가적으로 피드백 해야 하는 것들을 진행"
- **Author**: Cowork as Level 10 founder persona (vault 45 audit supplement)
- **Scope**: 3 high-impact operational spec (PCR + PWC + PostHog event schema)
- **Vault cascade**: vault 45 §8 + §9 + §11 보강 + vault 26 + 31-tracker 영역 cascade
- **Operator review priority**: HIGH for §1 PCR (자문 form submit 전 작성 의무)
- **Cowork standby**: §6 trigger 대기
