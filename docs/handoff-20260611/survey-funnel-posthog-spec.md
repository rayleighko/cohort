# Survey Funnel — PostHog Event Spec v0.1

> **Status:** Draft (2026-06-11) — events defined, instrumentation pending.
> **Scope:** Unified 24-step survey (`SurveyModal`: Q0 → GL-RTS 13 → factual Q1–Q10).
> **SoT for step indices:** `src/components/onboarding/SurveyModal.tsx` (`LAST_STEP = 23`).
> **Feedback loop:** Acquisition inner loop (see loop design); verifier = PostHog funnel + DB row check, not founder impression.

---

## 1. Design principles

| Principle | Rule |
|-----------|------|
| Single taxonomy | All names live in `src/lib/analytics/events.ts` (`COHORT_EVENTS`) |
| Client-first | Step views / navigation captured client-side (`posthog-js`) |
| Server-verify | Submit success/failure captured server-side (`posthog-node`) — independent of client |
| No PII in properties | Never send portfolio %, free-text Q10/Q11, or email in event props |
| Option B safe | Event copy in dashboards only; no advisory semantics in property names |
| `profile_version` | Include `glrts-ko-v0.1` on completion events for cohort segmentation |

---

## 2. Funnel map

```
survey_opened
  └─ survey_step_viewed (×1–24)
       ├─ survey_step_advanced (next)
       ├─ survey_step_back (optional)
       ├─ survey_q0_learning_exit (branch — graceful exit)
       ├─ survey_gl_rts_section_complete (step 13 → 14)
       └─ survey_factual_section_complete (step 23 submit attempt)
            ├─ survey_submit_success (server)
            └─ survey_submit_failed (server)
survey_abandoned (modal close before success)
survey_completed (client ack after 200 — or alias onboarding_complete)
```

**Step index reference**

| Step | Kind | `question_id` |
|------|------|----------------|
| 0 | `q0` | `q0_user_stage` |
| 1–13 | `gl_rts` | `q1` … `q13` |
| 14 | `factual` | `q1_time_horizon` |
| 15 | `factual` | `q2_portfolio_composition` |
| 16 | `factual` | `q3_macro_watching_freq` |
| 17 | `factual` | `q4_info_sources` |
| 18 | `factual` | `q5_split_buy_enforcement` |
| 19 | `factual` | `q6_plan_formalization` |
| 20 | `factual` | `q7_emotional_decision_count` |
| 21 | `factual` | `q8_framework_affinity` |
| 22 | `factual` | `q9_weakness_self_assessment` |
| 23 | `factual` | `q10_target_outcome` (+ `q11` self-describe same step if combined) |

---

## 3. Event catalog

### 3.1 `survey_opened`

| Field | Value |
|-------|-------|
| **Trigger** | `SurveyModal` mounts with `open=true` |
| **Surface** | Client |
| **Purpose** | Funnel entry denominator |

**Properties**

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| `total_steps` | number | yes | `24` |
| `entry_surface` | string | yes | `dashboard_modal` \| `onboarding_gate` \| `settings_retest` |
| `ab_variant` | string | no | From `posthog.register_once` |
| `is_retest` | boolean | no | Future: `profile_snapshot` retest |

---

### 3.2 `survey_step_viewed`

| Field | Value |
|-------|-------|
| **Trigger** | `step` state changes (including initial step 0) |
| **Surface** | Client |
| **Purpose** | Drop-off analysis per step |

**Properties**

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| `step_index` | number | yes | `0`–`23` |
| `step_kind` | enum | yes | `q0` \| `gl_rts` \| `factual` |
| `question_id` | string | yes | See §2 table |
| `progress_pct` | number | yes | `Math.round((step / LAST_STEP) * 100)` |
| `section` | string | yes | `qualification` \| `gl_rts` \| `factual` |

---

### 3.3 `survey_step_advanced`

| Field | Value |
|-------|-------|
| **Trigger** | User clicks Next and validation passes |
| **Surface** | Client |

**Properties**

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| `from_step` | number | yes | |
| `to_step` | number | yes | |
| `from_question_id` | string | yes | |
| `duration_ms` | number | no | Time on step (client timer) |

---

### 3.4 `survey_step_back`

| Field | Value |
|-------|-------|
| **Trigger** | User clicks Back |
| **Surface** | Client |

**Properties:** `from_step`, `to_step`, `from_question_id`

---

### 3.5 `survey_q0_learning_exit`

| Field | Value |
|-------|-------|
| **Trigger** | Q0 = `learning` → graceful exit screen shown |
| **Surface** | Client |
| **Purpose** | ICP filter — not an error |

**Properties**

| Property | Type | Required |
|----------|------|----------|
| `q0_user_stage` | string | yes | `learning` |

---

### 3.6 `survey_gl_rts_rationale_toggled`

| Field | Value |
|-------|-------|
| **Trigger** | "근거 보기" expand/collapse in `GlRtsQuestionStep` |
| **Surface** | Client |
| **Purpose** | Trust-device engagement signal |

**Properties:** `question_id` (`q1`–`q13`), `expanded` (boolean)

---

### 3.7 `survey_gl_rts_section_complete`

| Field | Value |
|-------|-------|
| **Trigger** | Advance from step 13 → 14 |
| **Surface** | Client |
| **Purpose** | Mid-funnel milestone (psychometric block done) |

**Properties:** `step_index` (13), `gl_rts_item_count` (13)

---

### 3.8 `survey_factual_section_complete`

| Field | Value |
|-------|-------|
| **Trigger** | User clicks Submit on step 23 (client pre-flight passed) |
| **Surface** | Client |

**Properties**

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| `has_q4_info_sources` | boolean | yes | ≥1 selected |
| `has_q10_outcome` | boolean | yes | non-empty trim |
| `q2_asset_count` | number | yes | Count of assets with % > 0 (not values) |
| `q8_framework_count` | number | yes | Selected frameworks count |

---

### 3.9 `survey_submit_success` (server)

| Field | Value |
|-------|-------|
| **Trigger** | `POST /api/survey` → 200 |
| **Surface** | Server (`posthog-node`) |
| **Purpose** | **Verifier** — ground truth for completion |

**Properties**

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| `profile_version` | string | yes | `glrts-ko-v0.1` |
| `q0_user_stage` | string | yes | Fit segment |
| `has_service_expectations` | boolean | yes | Q10 stored |
| `info_source_count` | number | yes | Q4 array length |
| `gl_rts_complete` | boolean | yes | Always true on 200 |

**Identity:** `distinctId` = authenticated `user.id` (never anonymous).

---

### 3.10 `survey_submit_failed` (server)

| Field | Value |
|-------|-------|
| **Trigger** | `POST /api/survey` → 4xx/5xx |
| **Surface** | Server |

**Properties**

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| `error_code` | string | yes | e.g. `invalid_gl_rts_answers`, `invalid_portfolio_composition`, `pipa_violation_absolute_amount` |
| `http_status` | number | yes | |

---

### 3.11 `survey_abandoned`

| Field | Value |
|-------|-------|
| **Trigger** | Modal closed (`onClose`) before submit success |
| **Surface** | Client |

**Properties:** `last_step_index`, `last_question_id`, `last_section`, `progress_pct`

---

### 3.12 `survey_completed` (client)

| Field | Value |
|-------|-------|
| **Trigger** | Client receives 200 from `/api/survey` |
| **Surface** | Client |
| **Note** | May alias or precede existing `onboarding_complete` — keep both for funnel flexibility |

**Properties:** `profile_version`, `total_duration_ms` (session timer from `survey_opened`)

---

## 4. `COHORT_EVENTS` additions (implementation checklist)

```typescript
// src/lib/analytics/events.ts — add when instrumenting
SURVEY_OPENED: 'survey_opened',
SURVEY_STEP_VIEWED: 'survey_step_viewed',
SURVEY_STEP_ADVANCED: 'survey_step_advanced',
SURVEY_STEP_BACK: 'survey_step_back',
SURVEY_Q0_LEARNING_EXIT: 'survey_q0_learning_exit',
SURVEY_GL_RTS_RATIONALE_TOGGLED: 'survey_gl_rts_rationale_toggled',
SURVEY_GL_RTS_SECTION_COMPLETE: 'survey_gl_rts_section_complete',
SURVEY_FACTUAL_SECTION_COMPLETE: 'survey_factual_section_complete',
SURVEY_SUBMIT_SUCCESS: 'survey_submit_success',
SURVEY_SUBMIT_FAILED: 'survey_submit_failed',
SURVEY_ABANDONED: 'survey_abandoned',
SURVEY_COMPLETED: 'survey_completed',
```

---

## 5. PostHog dashboard recipes

### 5.1 Primary funnel (acquisition loop verifier)

```
survey_opened
→ survey_gl_rts_section_complete
→ survey_factual_section_complete
→ survey_submit_success
```

**Breakdown:** `entry_surface`, `ab_variant`, `q0_user_stage` (on success).

**Alert:** Step-5→Step-6 drop-off > 40% week-over-week → UX investigation (structural), not copy tweak.

### 5.2 GL-RTS friction

- `survey_step_viewed` filtered `step_kind = gl_rts`
- Breakdown by `question_id`
- Secondary: `survey_gl_rts_rationale_toggled` rate per question

### 5.3 Q4 / Q10 revival check

- `survey_factual_section_complete` where `has_q4_info_sources = false` (should be 0% at submit)
- `survey_submit_success` where `has_service_expectations = false` (should be 0%)

### 5.4 Server/client reconciliation

Weekly query: count `survey_completed` (client) vs `survey_submit_success` (server). Gap > 5% → instrumentation bug.

---

## 6. Implementation order

| Phase | Work | Owner |
|-------|------|-------|
| P0 | Add events to `events.ts` | Agent |
| P0 | `SurveyModal` — `survey_opened`, `step_viewed`, `advanced`, `abandoned` | Agent |
| P1 | `GlRtsQuestionStep` — `rationale_toggled` | Agent |
| P1 | `POST /api/survey` — `submit_success` / `submit_failed` | Agent |
| P2 | PostHog dashboard + weekly review ritual | Ray |
| P2 | Tie `survey_completed` → existing `onboarding_complete` if redundant | Decision |

---

## 7. Out of scope (v0.1)

- Light 2Q anonymous landing funnel (separate spec when built)
- `scoreGlRts` result properties (wait until Task 5 Green — no client-side score leakage)
- Portfolio % values in any event (PIPA)
- A/B on question order (future)

---

## 8. References

- `docs/handoff-20260611/survey-merge-map.md` — approved flow
- `docs/handoff-20260611/gl-rts-13-korean.md` — GL-RTS SoT
- `src/lib/analytics/events.ts` — event taxonomy
- Vault 62 §1 Q3 — quota events pattern (`chat_quota_hit` precedent)
