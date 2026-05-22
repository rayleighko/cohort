---
name: cohort-microinteraction-designer
description: Microinteraction + animation designer for Cohort UI (V1 static-only scope per 5-week cap). Triggers on "add transition", "animate this", "design hover state", "loading animation", "state change animation", "mascot transition", "fade in", "slide animation", "어떻게 움직일까". Outputs animation spec with duration + easing + transform + reduced-motion fallback + Tailwind/CSS implementation hint. Hard constraint: calm + subtle (sophisticated retail tone, flashy 배제) + prefers-reduced-motion respect mandatory + 8 V1 patterns only.
---

# cohort-microinteraction-designer — Skill

## When this skill triggers

User request involves:
- "Add a transition to this" / "Transition 추가" / "Animate state change"
- "Animate this" / "이 컴포넌트 애니메이션" / "Hover state design"
- "Loading animation" / "Skeleton shimmer" / "스피너 패턴"
- "Slide-up modal" / "Bottom sheet animation"
- "Mascot state transition" / "Aurora calm → concerned 어떻게 부드럽게"
- "Fade in this section" / "Scroll-driven animation"
- "Success feedback animation"
- Any motion / transform / opacity choreography request

If user asks for *full mascot illustration animation* (e.g., wing-flap, eye-blink loop), defer — V1 = static only per 5-week cap (40-design-system §5 + 43-mascot-illustration-brief §0.2). Defer to V2.

## Hard constraints

### Constraint 1 — Cohort tone (calm + subtle)

Cohort = sophisticated retail (Linear/Notion DNA, 40-design-system §1.5). Animation principles:

- **Calm > flashy**. Subtle elevation + opacity + small transform. NO bouncy springs, NO confetti, NO color rainbow, NO 3D rotation.
- **Meaningful > decorative**. Every animation serves a UX purpose (state communication, spatial continuity, status signal). Random "delight" pulses banned (40 §6.3 slot-machine anti-pattern).
- **200-300ms default**. Fast enough not to slow user; slow enough to register.
- **Single transform per element** (don't combine translate + scale + rotate simultaneously).

### Constraint 2 — Tokens (40-design-system §2.6 + 42-typography-color §6.2)

| Duration token | Value | Tailwind | Use |
|---|---|---|---|
| `fast` | 150ms | `duration-150` | micro (button press, hover, focus) |
| `standard` (DEFAULT) | 250ms | `duration-300` (250ms closest), use custom 250 if config supports | state change, modal open, page entry |
| `slow` | 400ms | `duration-500` (400ms approximate) OR custom | emphasis (mascot state transition) |
| `slower` | 600ms | custom (extend config) | dramatic (석류 seed populate) |

| Easing token | Value | Tailwind | Use |
|---|---|---|---|
| `ease-out` (default) | cubic-bezier(0.16, 1, 0.3, 1) | `ease-out` | decelerate, most entries |
| `ease-in` | (custom) | `ease-in` | exits (modal close, dismissal) |
| `ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | `ease-in-out` | bidirectional (state transitions) |
| `linear` | linear | `ease-linear` | progress bars, pulse loop |

**Hard rule**: When tailwind.config.ts doesn't yet define `transitionDuration.fast/slow/slower` or `transitionTimingFunction.ease-out`, propose adding per 42 §6.2 before using in component.

### Constraint 3 — prefers-reduced-motion (WCAG 2.3.3)

**MANDATORY** for every animation:

```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}
```

Tailwind equivalent: `motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animate-none`

Acceptable fallback alternatives (when fade-only OK):
- transform animations → opacity-only OR instant
- continuous loops (skeleton shimmer, pulse) → static state OR slower static reveal
- mascot-blink → no blink (static eye)

### Constraint 4 — V1 scope: 8 patterns only

Per 41-interaction-patterns §7.2, V1 ships these 8 patterns. ANY other animation pattern = defer to V2 or propose as 9th + sub-agent review.

## The 8 V1 animation patterns

### Pattern 1 — fade-in (page/section entry)

**Spec**:
- Duration: 250ms
- Easing: ease-out
- Properties: opacity 0 → 1 (only)
- Trigger: mount / intersection observer
- Reduced-motion: instant (opacity stays 1)

**Tailwind impl**:
```tsx
<div className="opacity-0 animate-fade-in motion-reduce:opacity-100">
  ...
</div>
```

Custom `animate-fade-in` keyframe (tailwind.config.ts extension):
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Pattern 2 — slide-up (modal bottom-sheet entry)

**Spec**:
- Duration: 250ms
- Easing: ease-out
- Properties: translateY(100%) → 0 + opacity 0 → 1
- Trigger: modal mount (mobile bottom-sheet per 41 §2.1)
- Reduced-motion: fade-in only (no translate)

**Tailwind impl**:
```tsx
<div className="
  translate-y-full opacity-0
  data-[state=open]:translate-y-0 data-[state=open]:opacity-100
  transition duration-300 ease-out
  motion-reduce:transition-opacity motion-reduce:transform-none
">
  ...
</div>
```

For ≥md centered modal: scale(0.96) → scale(1) + fade (per 41 §2.1).

### Pattern 3 — pulse (loading skeleton shimmer)

**Spec**:
- Duration: 1500ms loop
- Easing: ease-in-out
- Properties: opacity 0.4 → 1 → 0.4 OR background gradient sweep
- Trigger: data fetching state
- Reduced-motion: static (opacity 0.7 constant)

**Tailwind impl**:
```tsx
<div className="
  animate-pulse
  motion-reduce:animate-none motion-reduce:opacity-70
">
  ...
</div>
```

Tailwind built-in `animate-pulse` works. Skeleton color: `bg-cohort-ink-05` or `bg-cohort-ink-10`.

### Pattern 4 — color-transition (state change)

**Spec**:
- Duration: 250ms (state change) OR 400ms (mascot state)
- Easing: ease-in-out
- Properties: background-color, color, border-color
- Trigger: state prop change (e.g., Aurora calm → concerned)
- Reduced-motion: instant color swap (no transition)

**Tailwind impl** (mascot avatar state):
```tsx
<div className="
  bg-aurora-calm
  data-[mood=concerned]:bg-aurora-concerned
  transition-colors duration-500 ease-in-out
  motion-reduce:transition-none
">
```

40-design-system §4: "Transition duration: 400ms (slow — emphasizes state shift)" applies to mascot specifically.

### Pattern 5 — shake (error feedback)

**Spec**:
- Duration: 400ms total (4 oscillations × 100ms)
- Easing: ease-in-out
- Properties: translateX(-4px → 4px → -4px → 0)
- Trigger: form validation error, button click on disabled
- Reduced-motion: **none** (visual shake replaced with color flash via Pattern 4)
- Single-fire (no loop), accompanied by error message (color + icon + text — color-blindness rule)

**Tailwind impl**:
```tsx
// Custom keyframe (tailwind.config.ts extend)
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

<input className={cn(
  "transition-colors",
  error && "animate-shake motion-reduce:animate-none motion-reduce:border-cohort-warning"
)} />
```

### Pattern 6 — check-bounce (success — subtle, NOT celebratory)

**Spec**:
- Duration: 400ms total
- Easing: ease-out
- Properties: scale(0) → scale(1.1) → scale(1) on check icon path
- Trigger: form success, save complete, milestone reached
- Reduced-motion: instant scale(1), no bounce
- Single-fire, accompanied by 1-sentence success toast (Aurora tone, NOT celebratory)

**Cohort tone constraint**: NOT confetti. NOT color rainbow. Just a subtle check appear. (Robinhood anti-pattern explicitly avoided — 40-design-system §6.3)

**Tailwind impl**:
```tsx
<svg className="
  scale-0 animate-check-bounce
  motion-reduce:scale-100 motion-reduce:animate-none
">
  <path d="..." />
</svg>
```

### Pattern 7 — mascot-blink (idle animation, V1 only)

**Spec**:
- Duration: 200ms per blink (eye scaleY 1 → 0 → 1)
- Easing: ease-in-out
- Interval: random 5-15s between blinks
- Trigger: mascot avatar mounted + state in [calm, alert, happy, proud]
- Mascot states `concerned` and `reflective` = no blink (intentional stillness)
- Reduced-motion: **no blink** (static eye)

**Scope V1 only**: mascot-blink is a tiny exception to "static only V1" — eye-only, no body animation. If user requests anything beyond eye blink (wing flap, head turn), defer to V2.

**Implementation**: JS interval inside MascotAvatar.tsx (W5 Day 1 swap-in, OR W4 if illustrator delivers early). Currently MascotAvatar is static — blink is OPT-IN for surfaces where mascot is prominent (FAB, MorningBriefCard hero).

```tsx
useEffect(() => {
  if (!isAnimationEligibleState(state)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const blink = () => {
    setEyeScale(0);
    setTimeout(() => setEyeScale(1), 200);
  };

  let timeout: NodeJS.Timeout;
  const schedule = () => {
    const delay = 5000 + Math.random() * 10000;
    timeout = setTimeout(() => {
      blink();
      schedule();
    }, delay);
  };
  schedule();

  return () => clearTimeout(timeout);
}, [state]);
```

### Pattern 8 — scroll-fade (lazy section reveal)

**Spec**:
- Duration: 400ms
- Easing: ease-out
- Properties: opacity 0 → 1 + translateY(16px) → 0
- Trigger: IntersectionObserver, 30% threshold
- Reduced-motion: instant (opacity 1, no transform)

**Tailwind impl**:
```tsx
<section className="
  opacity-0 translate-y-4
  data-[in-view=true]:opacity-100 data-[in-view=true]:translate-y-0
  transition duration-500 ease-out
  motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0
">
```

Use case: Landing page section reveal as user scrolls. NOT for above-fold content (above-fold should render immediately).

## Workflow

### Step 1 — Identify pattern

User describes a motion intent. Map to one of the 8 V1 patterns:

| User intent | Pattern |
|---|---|
| "Section appear smoothly" | fade-in (#1) |
| "Modal slides up from bottom" | slide-up (#2) |
| "Data is loading" | pulse (#3) |
| "State changed (color)" | color-transition (#4) |
| "Form input shaking on error" | shake (#5) |
| "Success check appears" | check-bounce (#6) |
| "Mascot looks alive" | mascot-blink (#7) (eye only V1) |
| "Section reveals on scroll" | scroll-fade (#8) |
| Other (custom) | DEFER to V2 OR propose 9th + escalate |

### Step 2 — Confirm constraints

Check:
- Cohort tone compliance (calm + subtle, not flashy)
- Token availability (duration / easing tokens in tailwind.config.ts? Add if missing)
- prefers-reduced-motion fallback specified
- Single transform per element (no combined transform/scale/rotate)

### Step 3 — Generate spec

Output a complete animation spec:

```
## Animation spec — <Component> <interaction>

**Pattern**: <Pattern #N name>
**Trigger**: <when this fires>

### Spec
- Duration: <ms>
- Easing: <ease-*>
- Properties: <transform / opacity / color>
- Loop / single-fire: <single-fire | loop>

### Reduced-motion fallback
<spec for prefers-reduced-motion: reduce>

### Implementation hint (Tailwind + CSS)

\`\`\`tsx
<element className="..." />
\`\`\`

If tailwind.config.ts needs extension:
\`\`\`typescript
// theme.extend additions
\`\`\`

### Cohort tone check
- Calm + subtle: ✓
- Meaningful (not decorative): ✓ — <purpose>
- No banned patterns (confetti / rainbow / 3D / loop without purpose): ✓
```

### Step 4 — Self-audit before output

- [ ] One of the 8 V1 patterns (or explicit V2 deferral)
- [ ] Duration ≤ 600ms
- [ ] Easing from approved set
- [ ] Single transform per element
- [ ] prefers-reduced-motion fallback specified
- [ ] Tailwind config extension proposed if needed
- [ ] Meaningful purpose stated (not decorative)
- [ ] No banned tone (confetti / rainbow / 3D)

## Anti-patterns this skill blocks

| # | Anti-pattern | Why blocked | Mitigation |
|---|---|---|---|
| MI-1 | Confetti on save / trade success | Robinhood anti-pattern (40 §6.3) | check-bounce (#6) subtle |
| MI-2 | Parallax scroll on hero | flashy / mobile perf hit | scroll-fade (#8) subtle reveal |
| MI-3 | Continuous color cycle (rainbow) | sophistication tier 위반 | color-transition (#4) single state change |
| MI-4 | Mascot wing-flap animation V1 | 5-week cap V2 defer | static SVG only V1 |
| MI-5 | Animation without reduced-motion fallback | WCAG 2.3.3 fail | mandatory motion-reduce: variant |
| MI-6 | 800ms+ transition | too slow, user friction | ≤600ms hard limit |
| MI-7 | Combined transform (translate + scale + rotate) | sophistication + perf 위반 | single transform per element |
| MI-8 | "Loading..." text replacing button label | layout shift (41 §1.3) | Spinner sm + label preserved |
| MI-9 | shake without color/icon companion | color-blindness fail | always shake + color + icon + text |
| MI-10 | Random "delight" pulse without trigger | slot-machine variance (40 §6.3) | every animation must have meaningful trigger |

## References

- `~/Documents/elevate-portfolio/40-design-system-architecture.md` §2.6 (motion tokens) + §6.3 (sticky anti-patterns)
- `~/Documents/elevate-portfolio/41-interaction-patterns.md` §7 (microinteraction principles + 8 V1 patterns)
- `~/Documents/elevate-portfolio/42-typography-color-system.md` §6.2 (transition tokens add prereq)
- `~/Documents/elevate-portfolio/43-mascot-illustration-brief.md` §0.2 (V1 static only — animation V2 defer)
- WCAG 2.3.3 Animation from Interactions
