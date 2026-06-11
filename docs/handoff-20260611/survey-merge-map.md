# onboarding 설문 ↔ GL-RTS 통합 매핑 표 (Task 4) — 2026-06-11

> 실측 기준: `src/components/onboarding/SurveyModal.tsx` + `src/app/api/survey/route.ts` +
> `supabase/migrations/0007_user_investment_profile.sql` + `0001_initial_schema.sql`(onboarding_response).
> GL-RTS SoT: `gl-rts-13-korean.md`. 결정 근거: `cohort-profile-engine-design.md` §7.1.
> 상태: **Ray 승인 완료 (2026-06-11)** — 구현 진행 중.

## 0. 실측 현황 (핸드오프 "Q1–Q15"와의 차이)

라이브 설문은 **Q0 + Q1~Q11** (vault 53 스펙의 Q1–Q15 중 일부가 구현에서 축소됨).
3층(UI/API/DB) 정합 실측에서 **구현 갭 4건** 발견:

| # | 갭 | 상세 |
|---|---|---|
| G1 | Q2(포트폴리오 구성 %) UI 부재 | API 검증 로직(PIPA % 검증)·DB 컬럼은 존재, SurveyModal에 스텝 없음 → 수집 안 됨 |
| G2 | Q4(정보 소스) dead state | FormState에 있으나 UI 스텝 없음 + submit payload에서도 누락 → 수집 안 됨 |
| G3 | Q10(기대 변화) 유실 | UI 수집 + API 수신하지만 upsert에 없고 **DB 컬럼 자체가 없음** → 응답이 조용히 버려짐 |
| G4 | 스키마 잔존 필드 3개 | `asset_goal_5y`·`payment_willingness_ceiling_krw`·`service_expectations` — 어떤 경로로도 수집 안 됨 |
| G5 | `onboarding_response` 테이블(0001, Section A~E) | 쓰기 경로 전무 (account/delete의 삭제 대상으로만 참조) — W1 레거시 |

## 1. 문항별 매핑 표 (라이브 설문 Q0–Q11)

판정: **[대체]** = GL-RTS가 측정 대체 / **[유지]** = 사실정보·행동정보로 유지 / **[삭제]** = 제거

| 기존 문항 | 측정 대상 | GL-RTS 겹침 | 판정 | 근거 |
|---|---|---|---|---|
| Q0 현재 투자 상태 (narrow filter) | 퍼널 적격성 | 없음 | **유지** (여정 1단계 고정) | graceful exit 필터. 라이트 진단의 Barnewall 문항(능동/수동)과는 측정이 다름 |
| Q1 목표 기간 | 투자 기간 (사실) | 없음 | **유지** | IPS 위저드(Phase 2) 직결 재료. GL-RTS는 기간 미측정 |
| Q2 포트폴리오 구성 % | 자산배분 현황 (사실) | GL-RTS Q11·Q12는 *가상 선택*, Q2는 *실제 현황* — 측정 다름 | **유지** + G1 해소 (UI 스텝 추가) | 설문-실제 괴리 분석(2채널 보정)의 기준선. PIPA % 검증 로직 이미 구현됨 |
| Q3 매크로 확인 빈도 | 행동 빈도 | 없음 | **유지** | behavioral_event 채널 보정 신호. 근시안적 손실회피 개입(확인 주기 제어)의 기준선 |
| Q4 정보 소스 | 정보 환경 (사실) | 없음 | **유지(조건부)** + G2 해소, 또는 **삭제** | 군집편향(편향 8문항, 후순위) 해석 재료. 단 지금껏 수집 0건이었으므로 가치 없다고 판단되면 삭제가 정직 |
| Q5 분할매수 원칙 | 집행 규율 (행동) | 없음 | **유지** | IPS 위저드 §원칙 문서화 직결. GL-RTS는 규율 미측정 |
| Q6 plan 형성 수준 | 원칙 문서화 정도 | 없음 | **유지** | IPS 위저드 진입점 분기 재료 (문서화 plan → 위저드 단축 경로) |
| Q7 감정적 매매 12개월 횟수 | 자기보고 행동 | GL-RTS 아님 — **편향 8문항**(후순위)과 겹칠 예정 | **유지, 편향 8문항 도입 시 재검토** | 처분효과/회전율 거울(Phase 2)의 자기보고 기준선. 손실회피는 GL-RTS Q9·Q10이 프레이밍 쌍으로 측정하지만 측정 구성개념이 다름(선호 vs 행동 이력) |
| Q8 framework 친화도 | 투자 철학 선호 (사실) | 없음 | **유지** | 코치 톤·콘텐츠 개인화 재료. BIT 유형과 별개 축 |
| Q9 흔들리는 상황 (자유 텍스트) | 행동 취약점 | GL-RTS Q6(위험 연상)과 *보완* 관계 | **유지** | behavioral guard 신호. 정성 데이터라 GL-RTS로 대체 불가 |
| Q10 기대 변화 (자유 텍스트) | 서비스 기대 | 없음 | **유지 + G3 해소** (`service_expectations`에 매핑 저장) 또는 **삭제** | 현재 응답이 버려지고 있음 — 살리려면 저장 경로 필요. G4의 `service_expectations` 컬럼 재활용 가능 |
| Q11 framework 자유 기술 | Q8 unsure fallback | 없음 | **유지** (Q8 종속) | |

**핵심 결론**: 기존 문항 중 GL-RTS와 측정이 실제로 겹치는 것은 **0건** — 기존 설문은 사실/행동/선호 축, GL-RTS는 위험감수성 축으로 상호 배타적. 따라서 "대체"가 아니라 **여정 통합 + GL-RTS 13문항 신규 삽입**이 정확한 작업. (vault 53 스펙 문항 중 미구현분(G4)이 자연 소멸된 것이 사실상의 "삭제"분)

## 2. 스키마 잔존 필드 (G4) 처리안

| 필드 | 제안 | 근거 |
|---|---|---|
| `asset_goal_5y` | **삭제 보류, 미수집 유지** (컬럼 drop은 비용 > 이득) | 5년 자산 목표는 IPS 위저드(Phase 2)에서 수집하는 게 맥락 적합 |
| `payment_willingness_ceiling_krw` | 동일 | 가격 결정은 사장님 lock-in 영역 — 설문 수집 실익 낮음 |
| `service_expectations` | **Q10 저장처로 재활용** (G3 해소) | 컬럼 추가 없이 유실 해결 |

## 3. 레거시 `onboarding_response` (G5) 처리안

- 쓰기 경로 전무 → V1 통합 설문은 `user_investment_profile`(+ 향후 `profile_snapshot`)로 단일화.
- Section A의 allocation_* 8컬럼은 Q2(JSONB %)와 중복 — 테이블은 **빈 상태로 보존**(0001 재작성 비용 회피), 통합 설문에서 미사용 명시. Phase 2+ 청소 대상.

## 4. 통합 여정 제안 (정식 설문, ~21문항 ≈ 5분)

```
Step 0   Q0 narrow filter (유지 — graceful exit)
Step 1   GL-RTS 13문항 (신규 — gl-rts-13-korean.md SoT, 문항당 "근거 보기" 토글)
         · Q9/10 쌍 평균 규칙, Q12 a=1/b=2/c=3 (D=4 오타 주의)
Step 2   사실문항 블록: Q1 기간 → Q2 구성% (G1: UI 신규) → Q3 빈도 → Q5 분할매수
         → Q6 plan 수준 → Q8+Q11 framework → Q9 취약점 → Q10 기대 (G3: 저장 연결)
         (Q4는 Ray 결정: 살리면 Step 2에 삽입 + G2 해소, 아니면 FormState 제거)
Step 3   채점(서버 전용) → BIT 유형(등대/물결/나침반/불꽃) + 금투협 5단계 병행 저장
         → profile_version = 'glrts-ko-v0.1'
```

## 5. Ray 결정 (2026-06-11 확정)

1. **매핑 표 전체 승인** — §1 통합(대체 아님) 그대로 구현 ✅
2. **Q4 (정보 소스)** — **살리기** (UI + payload 연결) ✅
3. **Q10 (기대 변화)** — **`service_expectations` 재활용 저장** ✅  
   - ⚠️ db push 문제 아님: 컬럼은 0007에 존재. API upsert 누락이 원인 → 코드 수정으로 해소
4. **GL-RTS 위치** — **사실문항 앞** (Q0 → GL-RTS 13 → 사실문항) ✅

## 6. UI 스택 (Ray 지시 2026-06-11)

- [UI UX Pro Max](https://ui-ux-pro-max-skill.nextlevelbuilder.io/) reference layer + vault 40–42 token SoT
- Tailwind + shadcn/Radix primitives (`radio-group`, `checkbox`, `label`, `textarea`, `progress`)
