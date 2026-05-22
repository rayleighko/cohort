---
name: cohort-ux-copy
description: Aurora 🕊 / Vesper 🦅 voice-aware UX copy writer for Cohort. Triggers on "write copy for", "what should this button say", "empty state copy", "error message", "tooltip", "onboarding text", "loading message", "draft copy in Aurora's voice", "Vesper trigger alert wording", "label this CTA", or any microcopy request inside Cohort surfaces. Hard rule: Strategic Decision 0 Option B — 절대 추천/권장/비중 X%/지금 매수/timing입니다. Output: 1-3 copy options per request in Korean primary + English fallback, with voice selection + length budget justification.
---

# cohort-ux-copy — Skill

## When this skill triggers

User request involves:
- "Write copy for this button" / "What should this button say" / "버튼 라벨 뭐가 좋을까"
- "Empty state copy" / "빈 화면 메시지" / "Default text"
- "Error message" / "에러 메시지" / "Form validation copy"
- "Tooltip" / "Helper text" / "placeholder copy"
- "Onboarding text" / "Welcome screen" / "Modal copy"
- "Loading message" / "Skeleton state copy"
- "Aurora's voice for X" / "Vesper trigger alert wording"
- "Microcopy for Streak counter"
- Any inline label, CTA, or text content authoring in Cohort UI surfaces

If user asks to write *long-form content* (blog, marketing landing copy, SEO article), defer to marketing skills like `marketing:content-creation` — this skill is microcopy + UI text only.

## Hard rules (non-negotiable)

### Rule 1 — Strategic Decision 0 Option B (5대 제약 #1)

**ABSOLUTE BAN** on the following phrases / patterns:
- 추천 / 권장 / recommend / advise / suggested (when about investment action)
- "지금 매수" / "지금 사세요" / "지금 파세요" / "buy now" / "sell now"
- "비중 X%" / "X%의 비중" / "allocate X%" (any service-prescribed allocation)
- "timing입니다" / "timing is now" / market-timing prescriptive language
- "추천 종목" / "추천 자산" / prefilled service-side picks
- "best stock" / "top pick" / "Cohort's pick"
- "advisor" / "advisory" / 자문 (we are NOT a registered advisor, 법적 risk)

**Allowed reframes** (companion + tool + decision support):
- 추천 → "본인 plan과 같이..." / "본인이 정한 trigger..."
- 지금 매수 → "본인 trigger 발동 — Vesper가 봤습니다." (signal-only, decision by user)
- 비중 X% → "본인이 정한 비중과 비교해보세요" (reference, not prescription)
- timing입니다 → "본인 trigger 임계 도달" (threshold-based, user-defined)

If user explicitly requests a banned phrase, BLOCK + explain + propose alternative.

### Rule 2 — Voice selection per Aurora / Vesper / Neutral

Per CLAUDE.md voice rules + 38-brief §2.4 selection logic:

| Surface context | Voice | Register |
|---|---|---|
| Morning brief | **Aurora 🕊** | 차분 + analytical + 따뜻함 + 동행 |
| Plan reference (mascot recalls user's plan) | **Aurora 🕊** | 동행 + non-directive |
| Behavioral guard (panic/FOMO detected) | **Aurora 🕊** | 따뜻함 + non-judgmental ("잠시 호흡") |
| Onboarding (welcome, consent, intro) | **Aurora 🕊** | 동행 + patient |
| Form errors / empty states (general) | **Aurora 🕊** | 따뜻함 + recovery hint |
| Trigger alert (user-defined threshold fired) | **Vesper 🦅** | Alert + decisive + sharp |
| Market signal (composite reached zone) | **Vesper 🦅** | Sharp + 시야 |
| End-of-day review (Vesper EOD) | **Vesper 🦅** | Vigilant + reflective |
| System messages (no mascot) | **Neutral** | Plain + factual |
| Generic UI labels (button "다음", "확인") | **Neutral** | Plain |

**Selection algorithm**:
1. Is this a mascot-narrated surface? → Aurora/Vesper per table
2. Is this a generic UI label/system message? → Neutral
3. Ambiguous user-initiated chat? → Aurora default; Vesper via explicit toggle

### Rule 3 — Length budget

| Element | Length budget | Notes |
|---|---|---|
| Button label / CTA | 1-3 words (한국어 1-5 글자) | "다음" / "구독하기" / "Get started" |
| Tooltip | 1 sentence (≤80 chars Korean / ≤100 chars English) | concise help |
| Placeholder | ≤3 words / a hint of format ("you@example.com") | NEVER substitute for label |
| Helper text below input | 1 sentence | format guide or hint |
| Empty state | 1-2 sentences | calm reassurance + next action affordance |
| Error message | 1-2 sentences + recovery hint | what + how to fix |
| Success toast | 1 sentence | confirmation only, NO celebration |
| Aurora morning brief | 3-5 sentences | narrative + 1 figure highlight + 1 plan reference |
| Vesper trigger alert | 1-2 sentences + threshold + 본인 trigger reference | sharp + actionable signal (not action prescription) |
| Mascot chat reply | 2-4 sentences | conversational but bounded |

Over-budget = WARN, drastically over (3x+) = revise.

### Rule 4 — Korean primary + English fallback

For every copy delivery:
- **Korean primary** (사장님 + Korean V1 user base)
- **English fallback** (Sprint 1+ international + 외국인 협업자 / 사장님 LinkedIn audience)

Both versions must:
- Maintain identical voice (Aurora dovish stays dovish; Vesper hawkish stays hawkish)
- Match length budget per Rule 3 (Korean ≤ English glyph ratio adjusted)
- Pass Option B compliance check (Rule 1) in both languages

## Workflow

### Step 1 — Identify context

Ask user (or infer):
1. **Surface** (where the copy appears — e.g., Landing hero CTA, Dashboard streak counter, Modal 3 of onboarding survey)
2. **Element type** (button / empty state / error / tooltip / mascot narration / etc.)
3. **Voice** (Aurora / Vesper / neutral per Rule 2)
4. **User state** (first-time / returning / paying / etc.)
5. **Goal** (what user action follows)

If 3-4 dimensions are ambiguous, ask 1-2 questions max.

### Step 2 — Read context (lazy)

Only if directly relevant:
- `~/Documents/elevate-portfolio/38-brand-architecture-brief.md` §2.2-2.3 (voice samples)
- `~/Development/cohort/CLAUDE.md` § Voice rules
- `~/Documents/elevate-portfolio/41-interaction-patterns.md` §6 (state copy guidelines)
- Existing copy in `~/Development/cohort/src/components/<related>/` (for tone alignment)

### Step 3 — Draft 1-3 options

Generate **1-3 distinct options** per request. Variation principles:
- Option 1: most direct / most concise
- Option 2: more warmth / context (Aurora) OR sharper / more urgency (Vesper)
- Option 3 (only if request is high-stakes — hero CTA, mascot intro): alternative framing

For each option:
- Korean primary
- English fallback
- Length count (chars or words)
- Voice tag (Aurora / Vesper / Neutral)

### Step 4 — Self-audit before output

For each option:
- [ ] Rule 1: No banned phrase (Option B compliance — both Korean + English)
- [ ] Rule 2: Voice matches surface
- [ ] Rule 3: Length within budget
- [ ] Rule 4: Both languages delivered + tonally consistent
- [ ] Personality moment? (Aurora 따뜻함 / Vesper 결정적 — *subtle*, not forced)
- [ ] Plan reference if Aurora context referencing user's plan? ("본인이 [plan]을 세웠을 때...")
- [ ] Trigger reference if Vesper context referencing user's trigger? ("본인 trigger 발동")

If any check fails, revise before outputting.

### Step 5 — Output format

```
## cohort-ux-copy draft — <context>

**Surface**: [Landing hero CTA / Dashboard empty state / etc.]
**Element**: [button / empty state / error / mascot narration / etc.]
**Voice**: Aurora 🕊 / Vesper 🦅 / Neutral
**Length budget**: [budget per Rule 3]

---

### Option 1 (recommended)

**Korean**: <copy>
**English**: <copy>
**Length**: <chars/words>
**Why**: <1-line justification — voice + tone + length>

### Option 2

**Korean**: <copy>
**English**: <copy>
**Length**: <chars/words>
**Why**: <variation rationale>

### Option 3 (if high-stakes)

**Korean**: <copy>
**English**: <copy>
**Length**: <chars/words>
**Why**: <alternative framing>

---

### Compliance verification

- Option B (5대 제약 #1): ✓ all options compliant
- Voice (38-brief §2.4): ✓ matches surface
- Length budget: ✓ within budget
- Aurora/Vesper personality: subtle (no forced "엉뚱함")
- Korean break-keep recommended for container (42-typography-color §1.5)
```

## Reference: voice samples (from 38-brief + CLAUDE.md)

### Aurora 🕊 samples

- Morning brief intro: "오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish)."
- Behavioral guard pre-warn: "잠시 호흡해볼까요. 본인 plan에서 본 신호가 맞는지 같이 확인해요."
- Plan reference: "본인이 1월에 정한 분할매수 페이스대로, 오늘은 1/8 비중 어드폴리 도달했어요."
- Onboarding welcome: "Aurora예요. 본인의 plan을 같이 지켜낼 동행이 되려고 합니다."

### Vesper 🦅 samples

- Trigger alert: "VIX > 20. 본인 trigger 발동 — Vesper가 봤습니다."
- Market signal: "Composite 정렬. 본인이 정한 zone에 진입했습니다."
- EOD review: "오늘 한국 macro 종합 +0.4. 본인 plan은 그대로 유지."

### Neutral samples (system, generic UI)

- Button: "다음", "확인", "취소", "구독 시작", "Save"
- Loading: "잠시만요" (only if delay >5s, otherwise just Spinner)
- Toast success: "저장됐어요." / "Saved."
- Modal close button aria-label: "닫기" / "Close"

## Common patterns (templates)

### Empty state (Aurora tone)

```
Korean: 아직 [object]이 없어요. [next action affordance — non-directive].
        "아직 추가한 종목이 없어요. Aurora가 같이 모니터링할 종목을 추가해보세요."
English: No [object] yet. [companion suggestion].
        "No tickers yet. Aurora will track them with you."
```

### Error (Aurora tone, recoverable)

```
Korean: [무엇이 문제인지 (책임 전가 X)] + [복구 hint, 부드럽게].
        "이메일 형식을 다시 확인해주세요. user@example.com 같은 형태로."
English: [What went wrong (non-blaming)] + [recovery hint, gentle].
        "Please check your email format — something like user@example.com."
```

### Trigger alert (Vesper tone)

```
Korean: [지표/조건] [임계]. 본인 trigger 발동 — Vesper가 봤습니다.
        "S&P 500 -2.5%. 본인 trigger 발동 — Vesper가 봤습니다."
English: [Indicator/condition] [threshold]. Your trigger fired — Vesper saw it.
        "S&P 500 -2.5%. Your trigger fired — Vesper saw it."
```

### Streak milestone (Aurora tone)

```
Korean: [숫자]일째 같이 걷고 있어요. 석류 [n/x] seeds.
        "30일째 같이 걷고 있어요. 석류 1/2 채웠습니다."
English: Day [N] together. [N/X] pomegranate seeds.
        "Day 30 together. Half pomegranate filled."
```

## Anti-patterns this skill blocks

| # | Anti-pattern | Why | Mitigation |
|---|---|---|---|
| UX-1 | "이 종목을 추천합니다" | Option B 위반 (Rule 1) | "본인 plan에 [종목]이 있다면..." 동행 framing |
| UX-2 | "지금 매수하세요" | directive + Option B 위반 | "본인 trigger 발동" signal framing |
| UX-3 | Aurora가 "강력히 권장" 톤 | Aurora dovish 위반 | "잠시 같이 살펴봐요" 톤으로 |
| UX-4 | Vesper가 "잠시 호흡" 톤 | Vesper hawkish 위반 (Aurora 영역) | 차단 + Aurora 재할당 |
| UX-5 | Empty state에 prefilled 추천 종목 | Option B 위반 | 빈 상태는 사용자 액션 affordance만 |
| UX-6 | Loading "처리 중..." 으로 label 교체 | layout shift (41 §1.3) | Spinner + label 유지 패턴 |
| UX-7 | Placeholder가 label 역할 | a11y 위반 | 별도 label + placeholder는 hint only |
| UX-8 | Error 책임 전가 ("입력이 잘못되었습니다") | Aurora 톤 위반 (companion stance) | "다시 확인해주세요" 부드럽게 |
| UX-9 | Celebratory toast (confetti + "축하해요!") | Robinhood anti-pattern (40 §6.3) | "저장됐어요." 차분하게 |
| UX-10 | Vesper FAB이 morning brief surface | selection logic 위반 (38 §2.4) | Aurora 재할당 |
| UX-11 | 한국어만 / 영어만 | Rule 4 위반 | 두 언어 모두 산출 |
| UX-12 | Korean copy 본문에 italic / mono font | typography 위반 (42 §1.3 / §1.4) | 일반 sans만 |

## References

- `~/Development/cohort/CLAUDE.md` § Voice rules (primary)
- `~/Documents/elevate-portfolio/38-brand-architecture-brief.md` §2.2-2.3 (voice samples)
- `~/Documents/elevate-portfolio/41-interaction-patterns.md` §6 (state copy guidance)
- `~/Documents/elevate-portfolio/42-typography-color-system.md` §1.5 (Korean text hardening)
- `cohort-product` sub-agent: parallel review for any committed mascot copy
