# PIPA Compliance — Cohort

Constraint 4 (PIPA strict). Living doc; built out W4-W5.

## Five mechanisms (per 22-compliance-review-prep R4)

1. **Onboarding consent flow** — `ConsentModal` collects `consent_analytics`,
   `consent_interview`, `consent_kakao_notification` (per 20-sim-real-verification
   §11.8). Built Day 2 (scaffold) → W4 (full).
2. **자동 anonymization** — regex redaction (`src/lib/utils/pipa-redact.ts`) +
   bucketing (`anonymize.ts`) before any data leaves the user's own scope.
3. **Encrypted storage** — Supabase at-rest encryption + RLS on every user-data
   table (8-table schema, `0001_initial_schema.sql`).
4. **즉시 삭제 옵션** — always accessible at Settings > 데이터 관리.
5. **Privacy Policy + ToS** — rendered before W5 launch (operator fill per
   27-privacy-policy-terms-draft; 31-tracker §6).

## Disclaimer

자본시장법 disclaimer (`<Disclaimer />`) appears on every user-facing surface
(14-arch §14.4-pre). Cohort = decision-support tool, NOT an investment advisor.

## TODO

- [ ] Day 2 — ConsentModal scaffold
- [ ] W4 — consent flow full + anonymization integration
- [ ] W5 — Privacy/ToS publish + 즉시 삭제 wiring
