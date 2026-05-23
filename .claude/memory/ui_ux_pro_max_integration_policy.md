---
name: ui-ux-pro-max-integration-policy
description: Day 8 cross-verify result — vault 38/40/41/42 wins on all design system specifics; UI UX Pro Max adopted only for pre-delivery checklist
metadata:
  type: project
  created_at: 2026-05-23
  source_commit: e00764e
  cross_ref: vault_sot_priority §4.3 (design system domain)
---

Day 8 (W2 Day 3) Cowork session에서 UI UX Pro Max v2.0 (nextlevelbuilder/ui-ux-pro-max-skill) install + cohort 정합 평가 결과 기록.

## Policy

**vault 38/40/41/42가 모든 design system specifics에서 final authority.** UI UX Pro Max는 **reference layer**로만 사용 — `vault_sot_priority §4.3` design system domain rule 적용.

## Day 8 cross-verify result (sub-task 1.5b empirical)

UI UX Pro Max design system generator를 "Korean fintech investing dashboard sophisticated retail" prompt로 호출 → output 받음. vault 38/40/41/42와 cross-verify:

| Domain | UI UX Pro Max recommendation | vault SoT | Decision |
|---|---|---|---|
| Color palette | Fintech-specific palettes (다양한 옵션) | vault 42 §3 cohort tokens (#A8243F / #E8A33D / #F8F4ED / #1A1A1A) + ink scale | **vault wins** — IndicatorCard / sparkline 영역에 cohort tokens 그대로 사용 |
| Typography pairing | Pretendard + Inter 등 추천 | vault 42 §3.1 Pretendard + Inter Variable | match — 채택 |
| UI style | Glassmorphism, Bento Grid, Minimalism 등 | vault 38 brand: Notion/Linear/Mailchimp Freddie aesthetic | **vault wins** — minimalist line art + flat color fill (vault 38 §1) 그대로 |
| Chart type | Sparkline minimal config recommendation (Recharts 정합) | vault 14 §line 80 Recharts | match — 채택 |
| Pattern | Industry-Specific Reasoning Rule (Fintech/Crypto) | vault 40 design-system-architecture | partial overlap — vault 40 wins on Cohort specifics |
| Pre-delivery checklist | Focus states / reduced-motion / contrast 4.5:1 / hover 150-300ms 등 | vault 40 §interaction + 41 §6 + 42 §6 + cohort-accessibility-auditor sub-agent | **partial adopt** — UI UX Pro Max checklist 일부 항목이 vault에 명시 안 됨 → 채택 |

## Adopted items (Day 8 ship reflection)

UI UX Pro Max v2.0 recommendation 중 **vault 정합 + 채택**된 항목:

1. **Pre-delivery checklist 일부 항목** (vault 명시 안 됐던 implementation detail):
   - cursor-pointer on all clickable elements
   - Hover states with smooth transitions (150-300ms)
   - prefers-reduced-motion respected
   - Focus states visible for keyboard navigation
   - Responsive: 375px, 768px, 1024px, 1440px

2. **Sparkline minimal config** (Recharts 정합):
   - `<ResponsiveContainer>` + `<LineChart>` + `<Line>` minimal (axis 숨김, gridLines off, dots off)
   - vault 14 §line 80 Recharts 명시 + UI UX Pro Max chart type recommendation 일치

3. **Chart type recommendation**: dashboard analytics에 sparkline 적합 — Day 8 IndicatorCard에 적용 (commit e00764e)

## Rejected items (vault wins)

UI UX Pro Max v2.0 추천 중 vault SoT 충돌로 **폐기**된 항목:

1. **Glassmorphism / Claymorphism style** — vault 38 §1: *"minimalist line art + flat color fill. NOT cartoonish, NOT 3D, NOT photo-realistic, NOT chibi, NOT flashy/Robinhood-style"*. Glassmorphism / Claymorphism은 Cohort brand identity와 정반대 → 폐기
2. **Industry-Specific palette variants** (Fintech/Crypto dark mode neon 등) — vault 42 §3 cohort tokens (pomegranate red + warm amber + warm ivory + charcoal)이 final → 폐기
3. **AI purple/pink gradients** — vault 38 §1 AVOID 명시 — 폐기

## Deferred for review (V1.1 / Sprint 1 검토)

향후 검토 가능 항목 (Sprint 0 cap 외):

1. **Bento Grid layout** — Sprint 0 W3-W5 Shape A full UI 또는 V1.1 dashboard polish 시 검토 가능
2. **Dark Mode (OLED)** variant — V1.1 또는 V2 검토 (현재 Sprint 0는 light mode only per vault 42)
3. **Industry-Specific Reasoning Rule** — Day 9+ 새 component 작성 시 UI UX Pro Max 호출 → vault cross-verify → 채택 부분만 적용

## How to apply (future component PRs)

1. **vault SoT가 final authority** — 모든 brand / token / typography / pattern은 vault 38/40/41/42 read 먼저
2. **UI UX Pro Max는 reference**: vault에 명시 안 된 implementation detail (예: hover transition timing, focus state styling)에서만 활용
3. **Cross-verify obligatory**: UI UX Pro Max recommendation 채택 전 cohort-design-system sub-agent dispatch + vault token 정합 확인
4. **Conflict resolution**: vault 우선, UI UX Pro Max 폐기

## Sub-task 0 install method (Day 8 recap)

```bash
# Global install (all projects 사용 가능)
npm install -g uipro-cli
uipro init --ai claude --global

# 또는 project-local
cd ~/Development/cohort
uipro init --ai claude
```

Install 위치: `~/.claude/skills/ui-ux-pro-max/` (global) 또는 `~/Development/cohort/.claude/skills/ui-ux-pro-max/` (project-local)

Design System Generator 호출:
```bash
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "Korean fintech investing dashboard sophisticated retail" --design-system -f markdown
```

## Cross-references

Related: [[vault-sot-priority]] (§4.3 design system domain) · [[vault-sot-38-to-43]] (vault SoT map)
Source commit: e00764e (Day 8 W2 Day 3 ship 2026-05-23)
Tool: nextlevelbuilder/ui-ux-pro-max-skill v2.0 (GitHub)
