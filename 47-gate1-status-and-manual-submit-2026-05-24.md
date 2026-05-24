# Gate 1 진행 status + 자문 신청 manual instruction (사장님 self-submit)

> **Trigger**: 사장님이 lawyer-attachment 1-5 file batch 작성하여 upload → Cowork이 자료 quality check + cohort.co.kr deployment 상태 verify + 자문 신청 site path verify 진행
> **Date**: 2026-05-24
> **Status**: Cowork 검증 완료, 사장님 manual submit 영역 안내 + 부분 capture 잔여 영역 안내

---

## 0. Summary — 3 영역 status

| 영역 | Status | 사장님 action 필요 |
|---|---|---|
| **자료 1-3 quality** (architecture / disclaimer / context) | ✅ lawyer-ready | PDF 변환 (선택) |
| **자료 4 user flow 16 screenshots** | ⚠ 4-5장 partial (랜딩 + 석류 visual + Aurora chat modal + advisory test) | 나머지 11-12장 캡처 — 단 ECOS_API_KEY + ANTHROPIC_API_KEY 재발급 후 |
| **자료 5 fintech application form** | ✅ verified — `https://sandbox.fintech.or.kr/apply/consulting.do?lang=ko` + "컨설팅 신청하기" button confirmed | 사장님 본인 계정으로 신청 |

---

## 1. 자료 1-5 quality check 결과 (Cowork verify)

5개 lawyer-attachment file 모두 정독 완료. 평가:

### ✅ 자료 1 — architecture-diagram.md
- Mermaid flowchart 1개 (High-level system) + sequence diagram 1개 (Aurora chat flow)
- 7-layer Option B 적용 evidence table (LLM prompt → safety filter → API route → UI disclaimer → onboarding consent)
- Tier별 surface table (Tier 0-3)
- 3-layer safety filter detail (regex pattern + Haiku classifier categories + redirect template verbatim)
- Anti-pattern surface list (Cohort가 회피하는 영역)
- PIPA + 개인정보 보호 alignment
- **Lawyer가 5-10분에 system architecture 직접 파악 가능 quality**

### ✅ 자료 2 — disclaimer-comprehensive.md
- Master disclaimer verbatim (line 13)
- Surface-by-surface verbatim (10 surfaces) — landing / dashboard / Aurora chat / onboarding consent / settings / Shape B / email / system prompt / safety filter
- LLM persona system prompt forbidden words 6 phrase verbatim ("추천 / 권장 / 지금 매수 / 지금 파세요 / 비중 X% / timing입니다")
- Safety filter implementation source line 명시 (line 10, 38, 216)
- Output post-generation check + chat route bidirectional safety
- 미통합 surface (W2-W5 build 잔여) 명시 (Shape A extended / Shape C / 카카오 알림톡 / Vesper)
- **Lawyer가 actual deployed copy를 verbatim 검토 가능 quality**

### ✅ 자료 3 — context-summary.md (1.5 page lawyer-friendly)
- 서비스 한 줄 정의 + Plancy 사업자 정보 (157-04-02001, 조윤환, 종로구 대학로12길 61)
- Tier 0-3 architecture summary
- Strategic Decision 0 Option B 6 layer 적용 evidence
- 자문 핵심 5 질문 (양방향 chat 분류 / Option B 효력 / Shape B 개별성 / 3 downgrade scenario / 회신 form)
- 운영자 sunk cost commit (자문 결과별 5 path)
- Tech stack + implementation maturity table
- **Lawyer가 5분에 Cohort 전체 grasp 가능 quality**

### ✅ 자료 4 — user-flow-capture-guide.md
- 8 화면 캡처 (mobile + desktop = 16장) instruction
- PII 회피 + 비공개 정보 회피 + 자연스러운 캡처 + #7 advisory redirect 핵심 verify
- Mobile Chrome DevTools 사용법 (iPhone SE / 12 Pro preset)
- Vercel deploy 안정화 prerequisite 명시
- **사장님 직접 작업 영역 (Cowork은 dev server 띄울 수 없음 → Cowork이 production site 접속하여 부분 capture 진행)**

### ✅ 자료 5 — fintech-application-guide.md
- 신청 form field별 작성 (회사명 플랜사이 / 사업자등록번호 157-04-02001 / 대표 조윤환 / 주소 종로구 대학로12길 61 / 이메일 gmj1197@gmail.com)
- 자문 분야 multi-select (자본시장법 / AI 서비스 / PIPA / 유사투자자문업)
- 자문 본문 verbatim (vault 46 §3) — 5 query paste-ready
- Step B 유료 자문 trigger 조건 + 부띠크 법무법인 후보 (비컴 / 초월)
- 사장님 self-commitment 5 path verdict matrix
- Cowork standby 작업 list (회신 대기 중 진행 가능)
- **lawyer-attachment 1-4와 함께 사용하면 사장님 manual submit 30분에 완료 가능 quality**

**종합**: 5개 자료 lawyer-ready. PDF 변환은 선택 (markdown viewer로도 lawyer 읽기 가능). 단 PDF 권장.

---

## 2. cohort.co.kr deployment 상태 verify 결과 (Cowork capture)

Chrome MCP로 cohort.co.kr 접속 + user flow capture 부분 진행. 결과:

### ✅ 정상 작동 영역

**랜딩 page** (`https://cohort.co.kr`):
- Hero copy: "본인 plan과 cohort — 흔들리지 않는 페이스." ✅
- Subline: "Top 5-10% sophisticated retail을 위한 투자 페이스 메이트. 정보 + 도구 + 의사결정 지원 — 추천도, 권장도 하지 않습니다." ✅
- 석류 (Pomegranate) visual ✅
- Aurora 🕊 + Vesper 🦅 feature card ✅
- Footer disclaimer: "본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문 서비스가 아닙니다. 모든 투자 결정과 손익은 사용자 본인의 책임입니다." ✅
- 사전 신청하기 CTA button ✅

**Aurora chat modal chrome** (`/dashboard` floating bubble click 후):
- "🕊 Aurora와 대화" header ✅
- Initial message: "안녕하세요. Aurora 🕊 입니다. 매크로 지표나 본인 plan reference, 또는 멘탈 관리 관련 질문 있으시면 천천히 적어주세요." ✅
- Modal footer disclaimer: "정보 + 의사결정 지원 도구입니다. 투자 자문이 아닙니다." ✅

### ⚠ 작동 안 함 영역 (사장님 환경 verify 필요)

**Dashboard 매크로 데이터** (`/dashboard`):
- 에러 메시지: "매크로 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해보세요."
- **추정 원인**: ECOS_API_KEY 평일 재발급 영역 (CLAUDE.md 명시: "ECOS 2개는 평일 재발급 결과 따라 degraded 가능")
- **영향**: capture #3 (dashboard top composite + Aurora narration) + #4 (dashboard bottom indicators + sparkline) 진행 불가

**Aurora chat advisory redirect (#7 critical evidence)**:
- 입력: "지금 KOSPI 매수해야 할까요?" (Layer 1 regex `/지금\s*매수/` catch 영역)
- 응답: **"[Aurora가 잠시 자리를 비웠습니다. 잠시 후 다시 시도해주세요.]"** (fallback)
- **추정 원인**: ANTHROPIC_API_KEY 또는 safety filter 호출 영역 issue
- **영향**: 가장 critical evidence (safety filter substance demo) 진행 불가

### Capture 결과 4-5장 (inline screenshot으로 conversation에 표시됨)

다음 4-5장이 Cowork에서 capture 완료 (사장님이 conversation에서 직접 view 가능):
1. ✅ Landing page Hero + brand mark (desktop)
2. ✅ Landing page 석류 visual + feature cards (desktop, scroll down)
3. ✅ Landing page Aurora/Vesper feature card + Tier pricing + footer disclaimer (desktop, scroll bottom)
4. ✅ Aurora chat modal opened (Initial welcome + disclaimer chrome)
5. ⚠ Aurora advisory request input + fallback response (substance demo 미완성)

**사장님 활용 방법**:
- Conversation에서 inline image 우클릭 → "이미지 저장" 또는 Cmd+S → 사장님 컴퓨터에 다운로드
- 또는 Cmd+Shift+4로 conversation 화면 직접 capture (전체 4-5장 batch)
- 또는 본 conversation을 export (Claude 우측 메뉴) → PDF 안에 inline image 포함

### 사장님 후속 action

**Action 1 — API key 재발급 verify (15-30분)**:
```
1. cohort/.env.local 또는 Vercel dashboard env vars 확인
2. ECOS_API_KEY 만료/유효 verify (한국은행 ECOS portal)
3. ANTHROPIC_API_KEY 만료/유효 verify (console.anthropic.com)
4. Vercel redeploy (env vars 변경 시 자동)
5. cohort.co.kr/dashboard 접속 → 매크로 데이터 정상 로드 verify
6. Aurora chat bubble → "지금 매수해야 할까?" 입력 → COHORT_FALLBACK_REDIRECT 작동 verify
```

**Action 2 — Cowork에 재시도 trigger**:
- 사장님 "API key 재발급 완료, cohort.co.kr 정상 작동" 알림 시 Cowork이 16 screenshots 재시도
- 또는 사장님 본인이 직접 Chrome DevTools mobile preset (iPhone SE 375px) + macOS Cmd+Shift+4 로 직접 캡처 (가이드 = 자료 4)

**Action 3 — 부분 capture로 자문 진행 (옵션)**:
- 4-5장 partial capture 그대로 lawyer에게 첨부 + "advisory redirect substance demo는 API key 재발급 후 추가 제출 예정" caveat 동봉
- Lawyer는 architecture diagram (자료 #1) + disclaimer verbatim (자료 #2) + system prompt forbidden words (자료 #2 §3) 만으로도 substance 평가 가능
- 단 #7 capture가 가장 critical이므로 *재발급 후 재시도가 권장*

---

## 3. 자문 신청 manual instruction — 사장님 self-submit (15-30분)

Cowork은 본인 신청을 대신 진행할 수 없는 이유:
1. Plancy 법인 계정 + 사장님 본인 정보 + 사업자등록번호 verify 영역
2. 신청자 책임 (privacy + legal)
3. 첨부 파일 = 사장님 컴퓨터의 file (Cowork sandbox와 별개)

단 Cowork이 verify한 정확한 path + button + form field를 따라가시면 30분 안에 완료.

### Step 1 — 신청 site 접속 (1분)

**URL**: https://sandbox.fintech.or.kr/apply/consulting.do?lang=ko

(또는 https://sandbox.fintech.or.kr/ → 메인 page에서 "컨설팅 신청" 클릭)

### Step 2 — 회원가입 / 로그인 (5분)

만약 한국핀테크지원센터 계정 없으면:
- 우상단 "회원가입" 클릭
- 사업자등록번호 157-04-02001 (Plancy) 입력
- 사장님 이메일 (gmj1197@gmail.com) 인증
- 비밀번호 설정

이미 계정 있으면 "로그인" → 인증

### Step 3 — "컨설팅 신청하기" 클릭 (1분)

페이지 중간 보라색 button **"컨설팅 신청하기"** 클릭.

페이지 내용 (Cowork verify):
- "한국핀테크지원센터는 금융규제 샌드박스의 효율적 운영을 위해 **무료 컨설팅**을 진행하고 있습니다."
- **컨설팅 종류**: 일반 컨설팅 + 샌드박스 컨설팅 (Cohort는 → **일반 컨설팅** 선택)
- 신청대상: 핀테크기업, 금융회사 (Cohort fit ✅)
- 컨설팅 진행: 센터 담당자 + 금융감독원 현장자문단 + **전문지원단** (67인 lawyer pool ✅)
- 신청시기: 상시
- 신청문의: 02-6375-1523, 1528, 1529 (전화 가능)
- 이메일: sandbox@fintech.or.kr

### Step 4 — Form 작성 (15-20분)

form 필드별 작성 (lawyer-attachment-5 §2 verbatim 활용):

| Field | 사장님 입력 |
|---|---|
| 회사명 | 플랜사이 (Plancy) |
| 사업자등록번호 | 157-04-02001 |
| 대표자명 | 조윤환 |
| 회사 주소 | 서울특별시 종로구 대학로12길 61 |
| 연락처 | (사장님 본인 전화) |
| 이메일 | gmj1197@gmail.com |
| 직책 | 대표 |
| 서비스명 | Cohort (코호트) |
| 서비스 URL | https://cohort.co.kr |
| 서비스 launch 시점 | 2026년 6월 중하순 (Sprint 0 W5 launch target) |
| 컨설팅 분야 | **일반 컨설팅** + 자본시장법 / 금융규제 / AI 서비스 관련 / PIPA |
| 자문 요청 내용 | **lawyer-attachment-5 §2 Field 4 본문 전체 paste** (verbatim 5 query + 첨부 자료 안내) |

### Step 5 — 첨부 파일 업로드 (5-10분)

첨부 파일 4-5개:
1. **자료 1**: `lawyer-attachment-1-architecture-diagram.md` (또는 PDF)
2. **자료 2**: `lawyer-attachment-2-disclaimer-comprehensive.md` (또는 PDF)
3. **자료 3**: `lawyer-attachment-3-context-summary.md` (또는 PDF)
4. **자료 4 (partial)**: Cowork capture 4-5장 (랜딩 + chat modal + advisory test) — **API key 재발급 후 16장 full capture 보완 예정 caveat 본문에 추가**

**PDF 변환 옵션** (lawyer가 markdown 안 읽을 수 있어 권장):
- macOS Preview: markdown file → "다른 이름으로 내보내기" → PDF
- Or pandoc: `brew install pandoc && pandoc lawyer-attachment-1-architecture-diagram.md -o attachment-1.pdf`
- Or Cowork에 "PDF 변환 batch 부탁" 요청 시 1 turn 내 변환

### Step 6 — Submit + 회신 대기 (1분)

- form 하단 "신청" 버튼 클릭
- 신청 완료 메시지 확인 + 신청 번호 record
- 이메일 알림 (보통 1-2일 내 신청 접수 확인 이메일 발송)

### Step 7 — 회신 timeline + 후속

| 시점 | Action |
|---|---|
| Day 0 (사장님 신청 제출) | 한국핀테크지원센터 form submission |
| Day 1-3 | 한국핀테크지원센터 접수 + lawyer pool 매칭 |
| Day 7-21 | lawyer 검토 + 회신 작성 |
| Day 21+ | 사장님 이메일 또는 form 회신 받음 → Cowork share → 결정 매트릭스 trigger |

만약 14일 후에도 회신 없으면 전화 follow-up (02-6375-1523).

---

## 4. 사장님이 지금 바로 할 수 있는 작업 (우선순위)

### 우선순위 1 — 자문 신청 form submission (오늘 가능, 30분)

5장 자료 + 4-5장 partial capture로 **오늘 또는 이번 주 안에 submit 가능**.

API key 재발급은 자문 신청과 독립적 — capture는 회신 받기 전 보완 가능 (form에 "추가 evidence 진행 예정" caveat).

### 우선순위 2 — API key 재발급 + cohort.co.kr 안정화 (오늘 또는 평일 30분)

- ECOS_API_KEY 한국은행 portal에서 발급 (영업일만 가능)
- ANTHROPIC_API_KEY console.anthropic.com에서 verify
- Vercel env vars 업데이트 + redeploy
- Production cohort.co.kr 정상 작동 verify

이게 끝나면 Cowork에 알림 → 16 screenshots full capture 재시도

### 우선순위 3 — W2 mini-checkpoint walkthrough 3명 personal-network (parallel, 1-2주)

자문 신청 + W2 walkthrough = parallel 진행 가능. 두 결과를 함께 받은 후 W3 build path 결정.

### 우선순위 4 — PDF 변환 (선택, 10분)

자료 1-3을 PDF로 변환하면 lawyer review easier. Cowork이 batch 변환 가능 (1 turn).

---

## 5. Cowork standby 영역 (사장님 trigger 시 진행)

| Trigger | Cowork 작업 | Effort |
|---|---|---|
| 사장님 "PDF 변환 batch 부탁" | 자료 1-3 markdown → PDF (pandoc 또는 macOS Preview path) | 1 turn |
| 사장님 "API key 재발급 완료" | Chrome MCP로 cohort.co.kr 재접속 → 16 screenshots full capture (mobile + desktop) | 1 turn |
| 사장님 "form submission 완료" | W2-close batch annotation 진행 (vault 26 + 44 + 24 등) | 2-3 turn |
| 사장님 "walkthrough 3명 완료" | walkthrough result aggregation + verdict matrix trigger | 1-2 turn |
| 사장님 "자문 회신 받음" | 회신 substance evaluation + verdict matrix → W3 build path 결정 | 2-3 turn |

---

## 6. Capture 4-5장 access path (lawyer 첨부용)

Cowork이 capture한 4-5장은 본 conversation에 inline image로 표시됨. 사장님 다운로드 방법:

### 방법 A — 우클릭 다운로드 (가장 빠름)
1. Conversation에서 capture image 우클릭
2. "이미지를 다른 이름으로 저장" 또는 Cmd+S
3. 사장님 Desktop 또는 `~/Desktop/cohort-lawyer-evidence/` folder에 저장

### 방법 B — Conversation export
1. Claude 우측 메뉴 또는 conversation 상단 "..." → "공유" 또는 "내보내기"
2. PDF 또는 HTML 형식으로 export
3. PDF 안에 inline image 모두 포함됨

### 방법 C — Cmd+Shift+4 (전체 화면 capture)
1. 사장님 화면에서 conversation scroll
2. Cmd+Shift+4 → 영역 선택 → 각 image capture
3. 4-5번 반복 (각 image 별도 file로 저장)

권장 = **방법 A** (가장 깔끔, 원본 quality 유지).

---

## 7. 사장님 결정 요청 — 우선순위 결정

다음 중 어느 path 진행할까요?

### Path 1 — Submit-first (권장)
- 오늘 4-5장 partial capture로 form submission 진행 (caveat 추가)
- API key 재발급 + capture 보완은 회신 대기 중 parallel 진행
- **장점**: 1-3주 회신 timeline 단축 (lawyer pool 배정 시간 확보)
- **단점**: #7 critical evidence가 처음에 약함

### Path 2 — Capture-complete-first
- 사장님 API key 재발급 + cohort.co.kr 안정화 (1-2일)
- Cowork 16 screenshots full capture
- 그 후 자문 신청 submission
- **장점**: #7 evidence 강함, lawyer 정확한 substance 평가 가능
- **단점**: 1-2일 지연

### Path 3 — Cowork 영역만 진행
- 자문 신청은 사장님이 알아서 진행 (manual instruction 참고)
- Cowork은 W2-close batch annotation 또는 PDF 변환 등 다른 영역 진행
- **장점**: parallel 효율
- **단점**: capture 보완 사장님 직접

---

## 8. File metadata

- **File**: `~/Development/cohort/47-gate1-status-and-manual-submit-2026-05-24.md`
- **Trigger**: 사장님이 lawyer-attachment 1-5 upload + Cowork이 verify
- **Cowork verification scope**: 5 file quality + cohort.co.kr live deployment + sandbox.fintech.or.kr path
- **Capture status**: 4-5장 partial (out of 16 target) — API key 재발급 후 보완 권장
- **Submit-ready status**: 사장님 form submission 30분 영역 (manual instruction §3 따라)
- **Vault cascade**: vault 46 §6 (회신 후 verdict trigger 결정 매트릭스)

---

## Sources (Cowork verify)

- [한국핀테크지원센터 — 메인 portal](https://fintech.or.kr/) — 정상 작동, 컨설팅 메뉴 verify
- [금융규제 샌드박스 — 메인 page](https://sandbox.fintech.or.kr/) — 정상 작동, 컨설팅 신청 entry point verify
- [컨설팅 신청 page](https://sandbox.fintech.or.kr/apply/consulting.do?lang=ko) — "컨설팅 신청하기" 보라색 button verify
- [Cohort production landing](https://cohort.co.kr/) — Hero + footer disclaimer + 석류 visual + Aurora/Vesper feature card 정상
- [Cohort production dashboard](https://cohort.co.kr/dashboard) — 매크로 데이터 에러 (ECOS_API_KEY 재발급 필요)
- Aurora chat modal — modal chrome + welcome message + disclaimer 정상, advisory request fallback (ANTHROPIC_API_KEY verify 필요)
