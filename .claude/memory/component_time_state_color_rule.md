---
name: component-time-state-color-rule
description: Day 5a contrast carry-over closed Day 5b — success/warning/ink-30 are icon/border/large-text only; body text uses cohort-danger or ink-70+
metadata:
  type: feedback
---

State colors defined per vault 42 §6.2 are correct at the token level but fail WCAG 2.1 AA 4.5:1 contrast at body text size:

- `cohort-success` #5B8C5A — 3.6:1 contrast (FAIL body, PASS large/icon)
- `cohort-warning` #C97E3E — 3.6:1 contrast (FAIL body, PASS large/icon)
- `ink-30` #ABABAB — 2.7:1 contrast (FAIL body, PASS large/icon/border)
- `ink-50` — also FAIL at body size

**Why**: Vault 42 §6.2 locked these as visual brand-aligned values. AO-5 says vault wins on token definition. But component-time enforcement is separate concern.

**How to apply** (component-time rule, enforced by cohort-accessibility-auditor + cohort-design-system):
- **Body text errors**: use `cohort-danger` (#8A1A30 — 7.4:1 PASS)
- **Body text captions**: use `ink-70` or darker
- **Success/warning/info**: icon + border + large-text (≥18px or ≥14px bold) only — never body paragraphs
- **ink-30**: dividers, borders, disabled placeholder text only

**Validation**: Day 5b enforced this for waitlist success/error states. Future component PRs MUST be reviewed by cohort-accessibility-auditor for state color usage compliance.

Related: [[ao-5-vault-wins]] [[vault-sot-38-to-43]]
