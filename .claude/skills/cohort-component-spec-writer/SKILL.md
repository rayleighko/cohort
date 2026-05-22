---
name: cohort-component-spec-writer
description: Component documentation template writer for Cohort UI. Triggers on "write a spec for", "document this component", "design handoff", "create component docs", "spec out the Button", or any request to produce a component design spec, props table, accessibility note, or pre-implementation design document. Emits one markdown file at ~/Development/cohort/docs/components/<name>.md following the locked template (props / states / a11y / mascot integration / copy guidelines / mobile / token sourcing).
---

# cohort-component-spec-writer — Skill

## When this skill triggers

User request involves:
- "Write a spec for the Button" / "Card spec 작성" / "Button 설계 문서"
- "Document this component" / "component docs"
- "Design handoff for X" / "handoff brief"
- "What goes in the spec for Modal" / "Modal 명세서"
- Any pre-implementation architecture/design document request for a specific component

If the user wants to write the *implementation code* immediately, defer to `cohort-token-keeper` skill instead. If user wants *visual asset commissioning brief* for mascots, that's `~/Documents/elevate-portfolio/43-mascot-illustration-brief.md` territory, not this skill.

## Workflow

### Step 1 — Confirm component identity

Ask user (or infer from context):

1. **Component name** (e.g., `Button`, `IndicatorCard`, `StreakIndicator`)
2. **Atomic level** (atom / molecule / organism per 40-design-system §3)
3. **Surface(s) where used** (e.g., Landing hero CTA, dashboard sidebar)
4. **Mascot integration** (Aurora / Vesper / neutral / N/A)

If ambiguous, ask 1-2 clarifying questions max.

### Step 2 — Read context

Read in order:
- `~/Documents/elevate-portfolio/40-design-system-architecture.md` (full)
- `~/Documents/elevate-portfolio/41-interaction-patterns.md` (relevant section per component type)
- `~/Documents/elevate-portfolio/42-typography-color-system.md` (token mapping)
- Existing component if it exists: `~/Development/cohort/src/components/<path>/<Name>.tsx`
- Existing spec if it exists: `~/Development/cohort/docs/components/<name>.md`

### Step 3 — Apply spec template

Generate spec following this exact structure. Use Korean primary + English fallback for descriptive prose.

```markdown
# <ComponentName> — Component Spec

**Atomic level**: atom / molecule / organism (40-design-system §3)
**File path**: `src/components/<surface>/<ComponentName>.tsx`
**Used by**: [list of parent components / surfaces]
**Status**: draft / in-implementation / shipped (W2 / W3 / W4 / W5)
**Last updated**: YYYY-MM-DD

**Related**: [[40-design-system-architecture]] · [[41-interaction-patterns]] · [[42-typography-color-system]] · [[43-mascot-illustration-brief]] (if mascot)

---

## 1. Purpose

목적 (Korean): [1-2 sentences — what user need this serves, which persona]
Purpose (English fallback): [same, in English]

---

## 2. Props (TypeScript)

\`\`\`typescript
interface <ComponentName>Props {
  // required
  prop1: Type;          // description
  prop2: 'a' | 'b';     // description

  // optional
  prop3?: Type;         // description (default: value)
  className?: string;
  onSomething?: (arg: Type) => void;
}
\`\`\`

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| prop1 | Type | ✓ | — | ... |
| prop2 | enum | ✓ | — | ... |
| prop3 | Type | — | value | ... |

---

## 3. States

각 state별 visual + token + transition. 41-interaction-patterns 참조.

| State | Visual | Tokens | Transition |
|---|---|---|---|
| default | ... | bg-X, text-Y | — |
| hover | ... | bg-X-hover | 150ms ease-out |
| active (pressed) | ... | bg-X-active + translateY(1px) | 150ms |
| focus-visible | ... | outline 2px X | — |
| disabled | ... | bg-ink-30, text-ink-50, cursor-not-allowed | — |
| loading | ... | Spinner sm + label preserved | — |
| error / empty / success (if applicable) | ... | per 41 §6 | — |

---

## 4. Accessibility (WCAG 2.1 AA)

- **Color contrast**: [check table — fg vs bg ratio, ≥4.5:1 body / ≥3:1 large/UI]
- **Touch target**: ≥44px height on mobile, ≥8px gap to neighbors
- **Focus visible**: focus-visible outline 2px + 4px offset
- **Keyboard**: Tab reachable, Enter/Space activate, ESC dismiss (if overlay)
- **Screen reader**:
  - Semantic HTML: \`<button>\` / \`<a>\` / \`<input>\` (avoid `<div>`+role unless necessary)
  - aria-label: [if icon-only]
  - aria-busy: [if has loading state]
  - aria-disabled / aria-required / aria-invalid: [as applicable]
  - aria-live: [if dynamic content]
- **Reduced-motion**: motion-reduce: fallback for any transform/translate animation
- **Color-blindness**: states distinguished by icon + text + color (not color alone)
- **Korean text**: break-keep on Korean body containers

---

## 5. Mascot integration

(Skip section if N/A — neutral system component)

- **Character**: Aurora 🕊 / Vesper 🦅 / configurable via prop
- **State surface**: which Aurora/Vesper state appears (calm / alert / happy / concerned / proud / reflective)
- **Voice rule** (38-brief §2.4 selection logic):
  - Aurora: morning brief / plan reference / behavioral guard / onboarding / errors
  - Vesper: trigger alert / market signal / EOD review
- **Avatar placement**: position (top-left, FAB bottom-right, inline narration left)
- **Shadow / glow**: shadow-mascot-aurora / shadow-mascot-vesper (42 §4)

Cross-ref `cohort-product` sub-agent before commit if mascot copy involved.

---

## 6. Copy guidelines

5대 제약 #1 (Option B) 절대 준수. `cohort-ux-copy` skill 활용.

- **Label / button text**: 1-3 words, action-oriented, Option B compliant (NO 추천/권장/지금 매수)
- **Helper / placeholder**: 1 sentence, calm tone
- **Empty state**: 1-2 sentences (Aurora tone if mascot integrated), Korean primary + English fallback
- **Error message**: 1-2 sentences + recovery hint, Aurora tone, color + icon + text combined
- **Tooltip**: 1 sentence max

Sample copy:
- [provide 2-3 examples in Korean primary + English fallback]

---

## 7. Mobile behavior + responsive

- **Default (mobile, < sm 640px)**: [describe layout]
- **sm: (≥ 640px)**: [enhancements]
- **md: (≥ 768px)**: [enhancements]
- **lg: (≥ 1024px)**: [enhancements]

- **Touch targets**: 44px+ height on mobile, OK to scale ≥sm
- **Bottom-fixed**: safe-area-inset accommodation if applicable
- **Modal pattern** (if modal): bottom-sheet on mobile, centered on ≥md

---

## 8. Token sourcing checklist

\`cohort-token-keeper\` skill verification:

- [ ] Colors: only \`text-cohort-*\` / \`bg-cohort-*\` / \`text-aurora-*\` / \`text-vesper-*\` Tailwind classes
- [ ] Typography: \`text-{xs|sm|base|lg|xl|2xl|3xl|4xl|5xl}\` + \`font-{normal|medium|semibold|bold}\`
- [ ] Font family: \`font-sans\` (default) or \`font-mono\` (figure only)
- [ ] Spacing: \`p-*\` / \`m-*\` / \`gap-*\` Tailwind scale (no arbitrary px)
- [ ] Shadow: \`shadow-*\` class
- [ ] Radius: \`rounded-*\` class
- [ ] Transition: \`duration-*\` + \`ease-*\` Tailwind class
- [ ] Required tailwind.config.ts tokens defined? If not, propose update per 42 §6.2

---

## 9. Implementation notes

- Files: \`src/components/<surface>/<ComponentName>.tsx\` (+ optional \`.test.tsx\`)
- Storybook: \`stories/<ComponentName>.stories.tsx\` (W3+ if Storybook adopted)
- shadcn/ui pattern: copy-paste primitive (40-design-system §1.2)
- Pre-commit: dispatch \`cohort-design-system\` + \`cohort-accessibility-auditor\` sub-agents

---

## 10. Anti-patterns to avoid

[Component-specific anti-patterns, cross-ref 41/42 each Anti-pattern section]

---

## Update log

- YYYY-MM-DD: spec created / updated
```

### Step 4 — File write

Write the populated spec to `~/Development/cohort/docs/components/<name>.md`.

If the `docs/components/` directory doesn't exist, propose creating it (mkdir + add to repo).

Filename convention: kebab-case from component name. Examples:
- `Button.tsx` → `docs/components/button.md`
- `IndicatorCard.tsx` → `docs/components/indicator-card.md`
- `MascotChatBubble.tsx` → `docs/components/mascot-chat-bubble.md`

### Step 5 — Output summary

After file write, print:

```
✓ Spec written: docs/components/<name>.md

Highlights:
- Atomic level: <atom|molecule|organism>
- Mascot integration: <character|none>
- Critical a11y note: <main concern>
- Tailwind config dependency: <NEW tokens needed|all satisfied>

Next steps:
1. Review spec with operator (사장님 or design partner)
2. If new tokens required → tailwind.config.ts PR first
3. Then implement component per spec
4. Dispatch cohort-design-system + cohort-accessibility-auditor before merge
```

## Bilingual policy

- Korean primary in section headers (when component is Korean-facing user surface)
- English fallback in section bodies (description prose)
- Token names + Tailwind classes + TypeScript types: English (universal)
- Copy examples: both Korean primary + English fallback

## Anti-patterns this skill prevents

| # | Anti-pattern | Mitigation |
|---|---|---|
| SP-1 | Spec without a11y section | Step 3 template includes §4 |
| SP-2 | Spec without mobile section | §7 mandatory |
| SP-3 | Spec without token sourcing checklist | §8 mandatory |
| SP-4 | Spec includes raw hex in examples | Step 3 references cohort-token-keeper |
| SP-5 | Spec missing mascot section when mascot involved | Step 1 identifies; Step 3 §5 enforces |
| SP-6 | Copy examples violate Option B | Step 3 §6 cross-refs cohort-ux-copy |
| SP-7 | Korean text without break-keep noted | §4 + §8 |

## References

- `~/Documents/elevate-portfolio/40-design-system-architecture.md`
- `~/Documents/elevate-portfolio/41-interaction-patterns.md`
- `~/Documents/elevate-portfolio/42-typography-color-system.md`
- `~/Documents/elevate-portfolio/43-mascot-illustration-brief.md` (if mascot)
- `~/Documents/elevate-portfolio/38-brand-architecture-brief.md` (voice rules)
- Existing specs: `~/Development/cohort/docs/components/*.md`
