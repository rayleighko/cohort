# Cohort — Project Working Memory

> Authoritative SoT: `~/Documents/elevate-portfolio/38-brand-architecture-brief.md`
> Methodology layer: `~/Documents/elevate-portfolio/39-claude-orchestration-methodology.md`
> This file = working summary auto-loaded every Claude Code session.

## Brand basics (LOCKED 2026-05-21)

- **Name**: Cohort / 코호트
- **Etymology**: Latin *cohors* — group sharing a journey
- **Mascots**: Aurora 🕊 (the Dove, dovish/patient/morning) + Vesper 🦅 (the Hawk, hawkish/decisive/evening)
- **Visual**: 석류 (Pomegranate) — multi-seed unifier
- **Colors**: `#A8243F` primary (pomegranate red) · `#E8A33D` amber (Vesper) · `#F8F4ED` ivory · `#1A1A1A` charcoal
- **Domain**: cohort.co.kr (Korean V1, Vercel DNS) · cohort.fund/.app deferred Sprint 1+
- **Repo**: rayleighko/cohort (public)

## Stack

- Frontend: Next.js 14 + TypeScript + Tailwind + PWA (manifest + service worker)
- Backend: Supabase (Postgres + Auth + RLS + Realtime + Storage)
- Payment: Polar (MoR, USD — Pro $19 / Premium $59). Toss Payments는 코드에 미구현 (KRW 결제 전략은 오픈 퀘스천 — docs/handoff-20260611/cohort-ideation-2026-06.md §9)
- AI: Claude API — `claude-haiku-4-5-20251001` (safety filter Layer 2) + `claude-sonnet-4-6` (Aurora/Vesper chat). `claude-opus-4-6` reserved.
- Delivery: Resend (email) + Web Push API + 카카오 알림톡 (Tier 2+)
- Analytics: PostHog + Sentry
- Hosting: Vercel + Supabase managed

## Strategic constraints (5 non-negotiable)

1. **Strategic Decision 0 Option B** — Information + Tool + Decision Support ONLY. NEVER 추천/권장/비중 X%/지금 매수/timing입니다.
2. **Mobile-first PWA strict** — Tailwind mobile-first, vertical stack, 44px+ touch, bottom-fixed CTA, manifest+SW required.
3. **Dual mascot safety filter 3-layer** — Layer 1 regex (ADVISORY_TRIGGER_PATTERNS) + Layer 2 Haiku classifier + Layer 3 redirect template. All Claude API calls (Aurora OR Vesper) pass through. Log to `mascot_chat.safety_filter_triggered` with `character` column.
4. **PIPA compliance strict** — Onboarding consent + Supabase RLS + 즉시 삭제 + Privacy/ToS before W5 launch.
5. **Sprint 0 5-week cap** — V1 = Shape A + B + C only. V2 (D/E/G/J/K) explicitly deferred. Mascots illustration only (no animation V1). PWA only (no native V1).

## Voice rules (Aurora + Vesper)

### Aurora 🕊 (the Dove)
- Register: 차분 + analytical + 따뜻함 + 동행
- Stance: dovish (patient compound, plan adherence, 분할매수 페이스)
- Surfaces: morning brief, plan reference, behavioral guard, onboarding
- Color palette: `#A8243F` family (pomegranate)
- Sample: "오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish)."

### Vesper 🦅 (the Hawk)
- Register: alert + decisive + sharp + vigilant
- Stance: hawkish (sharp opportunity, decisive trigger)
- Surfaces: trigger alert, market signal, end-of-day review
- Color palette: `#E8A33D` family (amber)
- Sample: "VIX > 20. 본인 trigger 발동 — Vesper가 봤습니다."

### Selection logic
- morning brief / plan reference / behavioral guard → Aurora
- trigger alert / market signal / end-of-day → Vesper
- ambiguous / user-initiated chat → Aurora default; Vesper via explicit toggle

## Anti-patterns (full list: `~/Documents/elevate-portfolio/09-anti-pattern-log.md`)

Cohort-specific:
- Sony CONCORD avoidance (Class 9 active enforcement) — `CONCORD` brand name BLOCKED
- Korean Concordia confusion (FPB concordia.kr + 컨콜디아사 concordia.co.kr) — `Concordia` brand BLOCKED
- 8-round naming archive: `~/Documents/elevate-portfolio/05-idea-jot.md` Entry 11

Methodology:
- AO-1 ad-hoc prompt construction → always use 39-methodology §2.1 template skeleton
- AO-2 skipping Tier 0 INIT → Day 0 verification gate every session
- AO-4 `--no-verify` push → BANNED. Fix hook root cause instead.
- AO-5 CLAUDE.md drift → vault 38-brief = SoT, CLAUDE.md = working summary, vault wins if conflict
- AO-10 Persona inconsistency → cohort-product sub-agent before mascot copy commit
- AO-16 Vault SoT Stale Assumption → Cowork가 vault 작성 시 git status verify 의무 (vault 62 §3 W3 Thu race condition first occurrence). Mitigation: vault 작성 전 *last verified commit hash* 명시 + commit 후 vault 작성.
- AO-17 CEO Spec-Reality Disconnect (Speculative concern without implementation verify) → CEO Cowork가 vault SoT spec만 know + production code verify 안 한 상태에서 concern raise → false positive. Mitigation: CEO feedback에 boundary 자동 명시 의무 — "✓ vault SoT 정합" (spec verified) / "✓ direct verify" (Chrome MCP 또는 operator dogfooding 확인) / "⚠ verify 필요 — implementation 직접 검증 X" (speculative, CTO ping 의무). Healthy mechanism: CTO verify reply 후 false positive withdraw + narrow refined ping. First case 2026-05-27 ECOS/FRED raw fetch misjudgment.

Design system (40/41/42/43 vault — bootstrap 2026-05-22):
- AD-1 Raw hex/px in component → cohort-token-keeper skill BLOCKS
- AD-2 Touch target < 44px on mobile → cohort-design-system + cohort-accessibility-auditor FAIL
- AD-3 Korean body without `break-keep` → cohort-design-system WARN
- AD-5 Option B 위반 component copy → cohort-ux-copy skill BLOCKS
- AD-6 Animation without prefers-reduced-motion fallback → cohort-microinteraction-designer + cohort-accessibility-auditor FAIL
- AD-7 Notification spam (>2/day) → Shape C trigger config hard cap
- AD-8 Comparative social / leaderboard → 40 §6.3 brand SoT 위반

## Slash command defaults

- Day start: `/context` (verify vault read) + `/goal` (declare stop condition)
- Before complex implementation: `/plan-eng-review`
- Day end: `/review` (PR-grade) + `/retro` (learnings) + `/learn` (capture)
- Mascot copy review: dispatch `cohort-product` sub-agent
- Safety filter change: dispatch `safety-filter-tester` sub-agent (W4+)
- UI component PR (Day 5+ mandatory): dispatch `cohort-design-system` + `cohort-accessibility-auditor` sub-agents in parallel
- Day 5+ auto-trigger skills (UI-集約 단계): `cohort-token-keeper` (before component write) + `cohort-ux-copy` (before any label/error/empty/microcopy) + `cohort-component-spec-writer` (before non-trivial component) + `cohort-microinteraction-designer` (before any animation/transition)

## Design system (bootstrap 2026-05-22, parallel Cowork session)

- **Vault SoT**: 40 (architecture) + 41 (interaction patterns) + 42 (typography/color) + 43 (mascot illustration brief). 40-design-system-architecture가 master, 41/42/43이 deep dive layer. 충돌 시 vault → tailwind.config.ts wins (raw value authority).
- **8 V1 component types**: Button · Card · Modal · MascotAvatar · MascotChatBubble · Input · Badge · ScoreDisplay (StreakIndicator 포함). V2 patterns 모두 5-week cap defer.
- **Project-local skills + agents** (committed to repo, `~/Development/cohort/.claude/`):
  - `.claude/agents/cohort-design-system.md` (token + interaction + mobile-first + Option B in components)
  - `.claude/agents/cohort-accessibility-auditor.md` (WCAG 2.1 AA 8-dimension audit)
  - `.claude/skills/cohort-token-keeper/SKILL.md` (pre-component token enforcement)
  - `.claude/skills/cohort-component-spec-writer/SKILL.md` (docs/components/<name>.md template)
  - `.claude/skills/cohort-ux-copy/SKILL.md` (Aurora/Vesper voice + Option B + Korean+English fallback)
  - `.claude/skills/cohort-microinteraction-designer/SKILL.md` (8 V1 animation patterns + reduced-motion)
- **W2 prereq**: tailwind.config.ts에 ink scale (`ink-{90,70,50,30,10,05}`) + state colors (`success/warning/danger/info`) + `fontFamily.mono` + `fontSize` overrides + `boxShadow.mascot-{aurora,vesper}` + `transitionDuration.{fast,slow,slower}` + `transitionTimingFunction.ease-{out,in-out}` + `screens.2xl` add (42 §6.2).
- **W5 prereq (PRE-W5 commissioning)**: Illustrator hire — Aurora 6 + Vesper 6 + 석류 launcher = 13 master illustration. 43-mascot-illustration-brief §7. 31-tracker에 add 대상.

## Conventional commit format

Format: `<type>(<scope>): <subject>` followed by blank line, body, blank line, footer.

Types: feat, fix, chore, docs, refactor, test, perf, style, build, ci.
Scopes: w1-day1, w2-day3, aurora, vesper, safety, payment, auth, landing, etc.

Example commit (literal newlines):

```
feat(w1-day4): implement Aurora + Vesper dual persona + safety filter 3-layer

- aurora-prompt.ts dovish framing per 38-brief §2.2
- vesper-prompt.ts hawkish framing per 38-brief §2.3
- safety-filter.ts Layer 1 regex + Layer 2 Haiku classifier + Layer 3 redirect
- mascot_chat table with character enum column
- 50+ unit test cases pass (cohort-safety-checker skill)

Co-reviewed-by: cohort-product (PASS)
```

## Sub-agent Workflow Discipline (LOCKED 2026-05-27, agent-agnostic)

### Single Commit Scope per Sub-task
- 한 sub-task = 한 logical commit. 여러 concerns 섞지 말 것.
- Sub-task scope에 명시된 파일만 stage. 다른 파일 변경분이 working tree에 있으면 STOP + 사용자 보고.

### Auto-commit at Sub-task End
- 모든 sub-task의 마지막 단계는 sub-agent (Cursor Composer / Claude Code / 등)가 직접 수행:
  1. `npx tsc --noEmit` 통과 확인
  2. 명시된 파일들만 `git add`
  3. `git commit` (제공된 메시지 사용)
  4. pre-commit hook 전부 통과 (실패 시 STOP, 절대 `--no-verify` 사용 금지 — AO-4 BANNED)
  5. commit hash + `git status --short` 보고

### Auto-push at Batch End
- 다중 sub-task batch (W4 Wed, W4 Thu 등)의 마지막 sub-task에서만 push 수행:
  1. 위 commit 단계 완료 후
  2. `git push origin main` (force-push BANNED, `--force-with-lease` BANNED)
  3. Push 실패 (non-fast-forward, remote diverged) 시 STOP + 사용자 manual
  4. Push 성공 후 remote ref hash 보고
- Mid-batch sub-task는 push 절대 수행하지 말 것.

### 권한 정의
- `git push origin main`만 자동화 대상. 다른 branch / remote는 사용자 manual.
- Force operation 전체 BANNED: `--force`, `--force-with-lease`, `push --delete` 등.
- Pre-push hook (있다면) 통과 필수. Bypass BANNED.

### Agent-agnostic Applicability
이 discipline은 어떤 AI 에이전트가 cohort 코드를 변경하든 동일하게 적용된다. .cursor/rules/main.mdc에도 동일 mirror가 존재한다. 만약 두 파일이 drift하면 .cursor/rules/main.mdc가 SoT. Cowork가 작성하는 prompt는 agent-agnostic 형식을 따른다.

## Vault references (key files)

| Topic | File |
|---|---|
| Brand spec (SoT) | `~/Documents/elevate-portfolio/38-brand-architecture-brief.md` |
| Methodology | `~/Documents/elevate-portfolio/39-claude-orchestration-methodology.md` |
| Design system architecture (master) | `~/Documents/elevate-portfolio/40-design-system-architecture.md` |
| Interaction patterns | `~/Documents/elevate-portfolio/41-interaction-patterns.md` |
| Typography + color system | `~/Documents/elevate-portfolio/42-typography-color-system.md` |
| Mascot illustration brief (PRE-W5 commissioning) | `~/Documents/elevate-portfolio/43-mascot-illustration-brief.md` |
| W1 implementation | `~/Documents/elevate-portfolio/25-sprint-0-w1-implementation-spec.md` |
| W2-W5 implementation | `~/Documents/elevate-portfolio/26-sprint-0-w2-w5-implementation-spec.md` |
| Architecture | `~/Documents/elevate-portfolio/14-v1-core-architecture-sketch.md` (apply brand mapping §7 of 38-brief) |
| Digital asset prompts + Brand logo system | `~/Documents/elevate-portfolio/44-digital-asset-prompts.md` (§2 individual digital assets + §3 brand logo system NEW 2026-05-23) |
| Vault SoT priority + drift catalog | `~/Documents/elevate-portfolio/vault_sot_priority.md` v0.1 DRAFT (operator sign-off pending via 23-batch-review-prep) |
| Landing copy | `~/Documents/elevate-portfolio/17-pre-launch-landing-page-sketch.md` (apply Set A-D taglines from 38-brief §4) |
| SEO content | `~/Documents/elevate-portfolio/24-pre-launch-seo-content.md` |
| Onboarding survey | `~/Documents/elevate-portfolio/20-sim-real-verification-mechanism.md` §11 |
| Privacy/ToS | `~/Documents/elevate-portfolio/27-privacy-policy-terms-draft.md` |
| Compliance | `~/Documents/elevate-portfolio/22-compliance-review-prep.md` |
| Operator tracker | `~/Documents/elevate-portfolio/31-operator-manual-prerequisites-tracker.md` |
| Master context | `~/Documents/elevate-portfolio/00-master-context.md` |
| Anti-patterns | `~/Documents/elevate-portfolio/09-anti-pattern-log.md` |

## Sprint 0 roadmap (5-week cap)

- W1: Foundation (PWA shell + Auth + Payment scaffold + Aurora/Vesper chat + Landing)
- W2: Tier 0 Macro Dashboard + Aurora narration
- W3: Shape A full + Shape B initial + Watchlist
- W4: Shape B full + Shape C initial + Onboarding survey + 카카오 비즈 (5-7일 lead)
- W5: Behavioral guard + Billing live + Privacy/ToS + Launch
