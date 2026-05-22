---
name: cohort-token-keeper
description: Pre-component token enforcement for Cohort UI. Triggers on "create a component", "add a button", "design a card", "style this element", "make this look like", "build a UI", or any request involving JSX styling / Tailwind class authoring. Reads 42-typography-color-system before writing component code, identifies which design tokens the component uses, verifies tailwind.config.ts mapping exists, blocks raw hex/px usage, and proposes config additions when a needed token is missing.
---

# cohort-token-keeper — Skill

## When this skill triggers

User request involves:
- "Create a component" / "컴포넌트 만들어" / "make a Button" / "Card 디자인"
- "Style this element" / "이 요소 스타일링" / "make this look like X"
- "Add hover state" / "loading state 추가" / "interactive feedback"
- Authoring any JSX with Tailwind className OR any inline `style` object

If the user's request is purely conceptual (asking *what* design choices to make) without intent to write code immediately, defer to `cohort-component-spec-writer` skill instead.

## Workflow

Before writing any component code, follow this checklist in order. Never skip.

### Step 1 — Read the typography + color SoT

Read `~/Documents/elevate-portfolio/42-typography-color-system.md` (full file). This is the semantic token authority.

Also read (lazily, only if relevant to current request):
- `~/Documents/elevate-portfolio/40-design-system-architecture.md` §2 (raw token spec)
- `~/Documents/elevate-portfolio/41-interaction-patterns.md` (for stateful components)
- `~/Development/cohort/tailwind.config.ts` (current implementation state)

### Step 2 — Identify required tokens

For the component requested, list:

| Dimension | Required token | Tailwind class |
|---|---|---|
| Text color | text-primary / text-secondary / text-aurora / etc. | `text-cohort-charcoal` / `text-cohort-ink-70` / `text-aurora-calm` / ... |
| Background color | bg-canvas / bg-surface / bg-aurora-calm / etc. | `bg-cohort-ivory` / `bg-white` / `bg-aurora-calm` / ... |
| Border color | border-subtle / border-focus | `border-cohort-ink-10` / `border-cohort-primary` |
| Font size | display / h1-h4 / body-lg / body / body-sm / caption | `text-5xl` / `text-4xl` / ... / `text-base` / `text-sm` / `text-xs` |
| Font weight | 400 / 500 / 600 / 700 | `font-normal` / `font-medium` / `font-semibold` / `font-bold` |
| Spacing | space-1..24 | `p-1` ... `p-24`, `m-*`, `gap-*` |
| Shadow | shadow-sm/DEFAULT/md/lg/mascot-aurora/mascot-vesper | `shadow-sm` / `shadow` / `shadow-md` / `shadow-lg` / `shadow-mascot-aurora` |
| Radius | rounded-sm/DEFAULT/md/lg/full | `rounded-sm` / `rounded` / `rounded-md` / `rounded-lg` / `rounded-full` |
| Transition | fast/250/slow/slower + ease-out/ease-in-out | `duration-150` / `duration-300` / `transition` / `ease-out` |

### Step 3 — Verify tailwind.config.ts mapping

Check `~/Development/cohort/tailwind.config.ts` (current state — read freshly each time):

- For each token in Step 2, confirm Tailwind class resolves to the expected value
- Tokens currently **defined** in tailwind.config.ts (W1 state):
  - `cohort.primary` `cohort.amber` `cohort.ivory` `cohort.charcoal`
  - `aurora.{calm,alert,happy,concerned,proud,reflective}`
  - `vesper.{calm,alert,happy,concerned,proud,reflective}`
  - `fontFamily.sans` = Pretendard
  - `screens.{xs,sm,md,lg,xl}`
- Tokens **not yet defined** but specified in 42 §6.2 (need PR before use):
  - `cohort.ink-{90,70,50,30,10,05}` — ink scale
  - `cohort.{success,warning,danger,info}` — state colors
  - `fontFamily.mono` — Berkeley Mono / JetBrains Mono
  - `fontSize` overrides (40-design-system §2.2 spec)
  - `boxShadow.mascot-aurora` `boxShadow.mascot-vesper`
  - `transitionDuration.{fast,slow,slower}`
  - `transitionTimingFunction.ease-out` `.ease-in-out`
  - `screens.2xl`

### Step 4 — Branch on token availability

#### A. All required tokens defined → PROCEED

Write the component using only Tailwind class names. Examples:

```tsx
// PASS: Button primary
<button className="
  h-11 px-4 rounded
  bg-cohort-primary text-cohort-ivory font-semibold
  hover:bg-aurora-alert active:bg-aurora-concerned
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-cohort-primary
  disabled:bg-cohort-charcoal disabled:text-cohort-ivory disabled:opacity-40
  transition duration-150 ease-out
">
  {label}
</button>
```

#### B. Missing token in tailwind.config.ts → BLOCK + PROPOSE

Stop. Output:

```
🚧 cohort-token-keeper BLOCKED

Component requires the following token(s) not yet in tailwind.config.ts:
  - cohort.ink-70 (#404040, body secondary text)
  - cohort.warning (#C97E3E, error state border)

Proposed tailwind.config.ts addition (per 42-typography-color-system §6.2):

  theme.extend.colors.cohort = {
    ...existing,
    'ink-70': '#404040',
    warning: '#C97E3E',
  }

Recommendation: Add to tailwind.config.ts as a SEPARATE commit BEFORE this component PR. Pre-push hook will not catch this — the agent will block the component PR if tokens are missing at component author time.

Escalate to sub-agent `cohort-design-system` for review of the config diff before proceeding with the component.
```

### Step 5 — Final compliance scan before output

Before returning component code:

- [ ] No raw hex anywhere (`#RRGGBB` literal in JSX or className arbitrary value)
- [ ] No raw px (`text-[14px]`, `p-[15px]`, `w-[100px]` arbitrary value)
- [ ] All colors via cohort-/aurora-/vesper- Tailwind class
- [ ] All sizes via Tailwind scale class (`text-base`, `p-4`)
- [ ] All fonts via `font-sans` (default) or `font-mono` (figure only)
- [ ] All shadows via `shadow-*` class (never inline)
- [ ] All radii via `rounded-*` class
- [ ] All transitions via `duration-*` + ease class
- [ ] Mobile-first: default classes target mobile, `sm:` / `md:` / `lg:` enhance
- [ ] Korean body containers: `break-keep` class
- [ ] Touch targets: `h-11` (44px) minimum on interactive elements
- [ ] Bottom-fixed: safe-area-inset accommodation

If any check fails, revise before outputting.

## Output

The component code (TypeScript + Tailwind), with a brief comment block at top citing which tokens were sourced from which vault sections:

```tsx
/**
 * <ComponentName>
 *
 * Tokens sourced (per cohort-token-keeper):
 * - Colors: text-cohort-charcoal, bg-cohort-ivory, border-cohort-ink-10
 *   (42-typography-color-system §2.1 — text-primary / bg-canvas / border-subtle)
 * - Typography: text-base font-normal (42 §1.2 body default)
 * - Spacing: p-4 (42 §3.1 — default gap mobile)
 * - Radius: rounded (42 §5 — button default)
 *
 * Mobile-first: default = mobile, md: enhance
 * Touch target: h-11 (44px) per 40-design-system §5.2
 * Korean text: break-keep applied (42 §1.5)
 */
```

## Anti-patterns this skill prevents

| # | Anti-pattern | Detection |
|---|---|---|
| TK-1 | `style={{ color: '#A8243F' }}` | inline hex |
| TK-2 | `className="text-[#A8243F]"` | arbitrary hex |
| TK-3 | `className="p-[15px]"` | arbitrary px |
| TK-4 | `className="text-[14px]"` | arbitrary font-size |
| TK-5 | Component uses undefined token (will silently fail Tailwind purge) | Step 3 verify |
| TK-6 | Mobile-first violation (`md:p-4` baseline) | Step 5 mobile-first check |
| TK-7 | Korean body without break-keep | Step 5 Korean check |
| TK-8 | Touch target < 44px | Step 5 touch check |

## References

- `~/Documents/elevate-portfolio/42-typography-color-system.md` (primary)
- `~/Documents/elevate-portfolio/40-design-system-architecture.md` §2 (raw tokens)
- `~/Documents/elevate-portfolio/41-interaction-patterns.md` (when stateful)
- `~/Development/cohort/tailwind.config.ts` (verify state)
