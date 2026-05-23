---
name: w2-day1-macro-calibration-alpha
description: W2 Day 1 chose 24-seo Page 5 calibration endpoints (Option α) over 25-w1 §5.3 sensitivity for macro composite
metadata:
  type: project
  decided_at: 2026-05-23
  shipped_commit: 31b5f40
---

W2 Day 1 (Day 6) macro composite scorer chose **Option α**: 24-seo Page 5 calibration endpoints, not 25-w1 §5.3.

**Why**: 26-spec line 37 verbatim names 24-seo Page 5 as the formula source: *"Composite macro score (per [[24-pre-launch-seo-content]] Page 5 formula)"*. 25-w1 §5.3 is template shape only — its calibration (e.g., spread -10 at 5%, dxy -10 at 120) overshoots realistic Korean spread range 0.8-1.8% (24-seo line 766-769) by 2× and produces a composite stuck near zero in practice.

**Anchors (24-seo Page 5 lines 887-893 verbatim)**:

| Indicator | -10 anchor | 0 anchor | +10 anchor | Symmetric? |
|---|---|---|---|---|
| 한미 금리차 (spread) | 2.5% | 1.25% | 0% | Symmetric |
| KRW (USDKRW) | 1550 | 1350 | 1200 | **Asymmetric** (piecewise) |
| VIX | 35 | 20 | 12 | **Asymmetric** (piecewise) |
| DXY | 110 | 100 | 90 | Symmetric |

**Implementation**: `src/lib/macro/composite.ts` (Day 6 ship commit 31b5f40). Piecewise linear normalize for asymmetric KRW + VIX. clamp10 helper for ±10 cap.

**5-zone band thresholds (24-seo Page 5 lines 897-901 verbatim)**:
- `score >= 5` → dovish
- `2 <= score < 5` → neutral-dovish
- `-2 < score < 2` → neutral
- `-5 < score <= -2` → neutral-hawkish
- `score <= -5` → hawkish

Half-open intervals (lower-closed positive side, mirror on negative).

**How to apply (W3+)**:
- All future macro work uses calibration in `src/lib/macro/composite.ts`. **Do not regress to 25-w1 5%/120 anchors.**
- W3 backtest with 2020-2026 historical data to verify score distribution sensitivity
- Annotation cleanup at W2 close: 25-w1 §5.3 to gain inline note "calibration is illustrative; production calibration per 24-seo Page 5"

**Drift catalog cross-ref**: vault_sot_priority light pointer Drift #6 (calibration 25-w1 §5.3 vs 24-seo Page 5). Resolved by Option α per 26-spec line 37 cross-reference + vault_sot_priority §4.4 evolution rule.

Related: [[vault-sot-priority]] [[ao-5-vault-wins]]
