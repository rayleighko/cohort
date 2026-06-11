'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type Q0Stage =
  | 'learning'
  | 'post_learning_planned'
  | 'active_investor_enforcement'
  | '';

const VALID_FRAMEWORK_VALUES = [
  'druckenmiller_macro_13f',
  'kimdante_macro_korea_us',
  'buffett_index_value',
  'dalio_all_weather',
  'kostolany_psychology_cycle',
  'technical_fundamental',
  'unsure',
] as const;

type FrameworkValue = (typeof VALID_FRAMEWORK_VALUES)[number];

interface FormState {
  q0_user_stage: Q0Stage;
  q1_time_horizon: string;
  q3_macro_watching_freq: string;
  q4_info_sources: string[];
  q5_split_buy_enforcement: string;
  q6_plan_formalization: string;
  q7_emotional_decision_count_12m: string;
  q8_framework_affinity: FrameworkValue[];
  q9_weakness_self_assessment: string;
  q10_target_outcome: string;
  q11_framework_self_described: string;
}

interface SurveyModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3" role="radiogroup">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors motion-reduce:transition-none ${
              selected
                ? 'border-cohort-primary bg-cohort-primary/5'
                : 'border-cohort-ink-10 bg-white'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="accent-cohort-primary h-4 w-4 shrink-0"
              aria-checked={selected}
            />
            <span className="break-keep text-sm leading-snug text-cohort-ink-90">
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function MultiSelect({
  values,
  onChange,
  options,
}: {
  values: FrameworkValue[];
  onChange: (vs: FrameworkValue[]) => void;
  options: { value: FrameworkValue; label: string }[];
}) {
  const toggle = (v: FrameworkValue) => {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors motion-reduce:transition-none ${
              selected
                ? 'border-cohort-primary bg-cohort-primary/5'
                : 'border-cohort-ink-10 bg-white'
            }`}
          >
            <input
              type="checkbox"
              value={opt.value}
              checked={selected}
              onChange={() => toggle(opt.value)}
              className="accent-cohort-primary h-4 w-4 shrink-0 rounded"
              aria-checked={selected}
            />
            <span className="break-keep text-sm leading-snug text-cohort-ink-90">
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function TextArea({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  name: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="break-keep text-sm font-medium text-cohort-ink-90">
          {label}
          {required && <span className="ml-1 text-cohort-primary">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-cohort-ink-10 bg-white px-4 py-3 text-sm leading-relaxed text-cohort-ink-90 placeholder:text-cohort-ink-30 focus:border-cohort-primary focus:outline-none"
        aria-required={required}
      />
    </div>
  );
}

// Q0 = learning → graceful exit
function GracefulExitScreen({
  onEmailSignup,
}: {
  onEmailSignup?: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onEmailSignup) {
      onEmailSignup(email);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col gap-5 py-2">
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl bg-cohort-ink-05 px-5 py-4"
      >
        <p className="break-keep text-sm leading-relaxed text-cohort-ink-70">
          Cohort는 이미 본인만의 plan이 있는 분들을 위한 페이스 동반자입니다.
        </p>
        <p className="mt-2 break-keep text-sm leading-relaxed text-cohort-ink-70">
          학습 단계에 계신 분들께는{' '}
          <strong className="text-cohort-ink-90">
            Valley / 이효석아카데미 / 김단테
          </strong>{' '}
          채널을 추천 영역에서 말씀드립니다. 학습을 마치신 후 다시 방문해 주세요.{/* OPTION-B-ALLOWED: 학습 리소스 안내 (교육 콘텐츠 — 투자 추천 아님) */}
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="break-keep text-xs text-cohort-ink-50">
            학습 완료 후 알림 받기 (선택)
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="min-h-[44px] flex-1 rounded-xl border border-cohort-ink-10 bg-white px-4 text-sm text-cohort-ink-90 placeholder:text-cohort-ink-30 focus:border-cohort-primary focus:outline-none"
              aria-label="이메일 주소"
            />
            <Button
              type="submit"
              variant="secondary"
              className="min-h-[44px] w-auto shrink-0 px-4 text-sm"
            >
              알림
            </Button>
          </div>
        </form>
      ) : (
        <p className="break-keep text-sm text-cohort-ink-50">
          등록되었습니다. 준비되시면 다시 찾아주세요.
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step configuration
// ──────────────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9; // Q0 (screen) + Q1, Q3, Q4, Q5, Q6, Q7, Q8+Q11, Q9, Q10

const Q0_OPTIONS = [
  {
    value: 'learning',
    label: '(a) 투자 시작을 위한 학습이 진행 중',
  },
  {
    value: 'post_learning_planned',
    label: '(b) 학습이 끝났고 본인 plan이 있으며 운용을 진행 중',
  },
  {
    value: 'active_investor_enforcement',
    label:
      '(c) Active investor + plan + 매크로 + 분할매수 enforcement가 in place',
  },
];

const Q8_OPTIONS: { value: FrameworkValue; label: string }[] = [
  { value: 'druckenmiller_macro_13f', label: '드러켄밀러식 매크로 베팅 + 13F 클로닝' },
  {
    value: 'kimdante_macro_korea_us',
    label: '김단테식 매크로 분석 + 한미 cross-border',
  },
  { value: 'buffett_index_value', label: '버핏식 인덱스 적립 + value investing' },
  { value: 'dalio_all_weather', label: '달리오식 all-weather + risk parity' },
  {
    value: 'kostolany_psychology_cycle',
    label: '코스톨라니식 심리적 cycle',
  },
  {
    value: 'technical_fundamental',
    label: '기술적/기본적 분석 (chart + 재무 통합)',
  },
  { value: 'unsure', label: '모름 / 본인 framework이 unsure' },
];

const TIME_HORIZON_OPTIONS = [
  { value: '3년 이하', label: '3년 이하' },
  { value: '3-7년', label: '3-7년' },
  { value: '7-15년', label: '7-15년' },
  { value: '15년 이상 / 세대 이전', label: '15년 이상 / 세대 이전' },
];

const MACRO_FREQ_OPTIONS = [
  { value: '매일', label: '매일 (1회 이상)' },
  { value: '주 2-3회', label: '주 2-3회' },
  { value: '주 1회', label: '주 1회' },
  { value: '월 1-3회', label: '월 1-3회' },
  { value: '거의 안 봄', label: '거의 안 봄' },
];

const SPLIT_BUY_OPTIONS = [
  { value: '항상 분할매수', label: '항상 분할매수 (원칙 있음)' },
  { value: '상황 따라 다름', label: '상황에 따라 다름' },
  { value: '일괄 매수 선호', label: '일괄 매수 선호' },
  { value: '아직 없음', label: '아직 원칙 없음' },
];

const PLAN_FORMALIZATION_OPTIONS = [
  { value: '문서화된 plan', label: '문서화된 plan (정기 review 있음)' },
  { value: '머릿속 plan', label: '머릿속 plan (비문서)' },
  { value: 'plan 형성 중', label: 'plan을 형성하는 중' },
];

const EMOTIONAL_DECISION_OPTIONS = [
  { value: '0회', label: '0회 (없었음)' },
  { value: '1-2회', label: '1-2회' },
  { value: '3-5회', label: '3-5회' },
  { value: '5회 이상', label: '5회 이상' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export default function SurveyModal({ open, onClose, onComplete }: SurveyModalProps) {
  const [step, setStep] = useState(0);
  const [gracefulExit, setGracefulExit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    q0_user_stage: '',
    q1_time_horizon: '',
    q3_macro_watching_freq: '',
    q4_info_sources: [],
    q5_split_buy_enforcement: '',
    q6_plan_formalization: '',
    q7_emotional_decision_count_12m: '',
    q8_framework_affinity: [],
    q9_weakness_self_assessment: '',
    q10_target_outcome: '',
    q11_framework_self_described: '',
  });

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Step titles for progress display (step 0 = Q0, then Q1, Q3..Q10)
  const stepTitles = [
    '현재 상태 확인',        // 0 — Q0
    '투자 기간',              // 1 — Q1
    '매크로 체크 빈도',       // 2 — Q3
    '분할매수 원칙',          // 3 — Q5
    'plan 형성 수준',         // 4 — Q6
    '감정적 결정 빈도',       // 5 — Q7
    '투자 framework',         // 6 — Q8 + Q11
    '흔들리는 상황',          // 7 — Q9
    '기대하는 변화',          // 8 — Q10
  ];

  const handleQ0Next = () => {
    if (!form.q0_user_stage) return;
    if (form.q0_user_stage === 'learning') {
      setGracefulExit(true);
    } else {
      setStep(1);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      void handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else if (step === 1) {
      setGracefulExit(false);
      setStep(0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q0_user_stage: form.q0_user_stage,
          q1_time_horizon: form.q1_time_horizon || undefined,
          q3_macro_watching_freq: form.q3_macro_watching_freq || undefined,
          q5_split_buy_enforcement: form.q5_split_buy_enforcement || undefined,
          q6_plan_formalization: form.q6_plan_formalization || undefined,
          q7_emotional_decision_count_12m:
            form.q7_emotional_decision_count_12m || undefined,
          q8_framework_affinity:
            form.q8_framework_affinity.length > 0
              ? form.q8_framework_affinity
              : undefined,
          q9_weakness_self_assessment:
            form.q9_weakness_self_assessment || undefined,
          q10_target_outcome: form.q10_target_outcome || undefined,
          q11_framework_self_described:
            form.q11_framework_self_described || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string; detail?: string };
        setError(data.detail ?? data.error ?? '제출 중 오류가 발생했습니다.');
        return;
      }
      onComplete?.();
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;
  const showUnsureTextArea = form.q8_framework_affinity.includes('unsure');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cohort-charcoal/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="투자 프로필 설문"
    >
      <div
        className="flex w-full max-w-md flex-col rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cohort-ink-10 px-5 py-4">
          <p className="text-sm font-semibold text-cohort-ink-90">
            투자 프로필 {!gracefulExit && step > 0 ? `${step} / ${TOTAL_STEPS - 1}` : ''}
          </p>
          <button
            onClick={onClose}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-cohort-ink-50 hover:text-cohort-ink-90"
            aria-label="설문 닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: '70vh' }}>
          {/* ─── Step 0 — Q0 narrow filter ─── */}
          {step === 0 && !gracefulExit && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="break-keep text-base font-semibold text-cohort-ink-90">
                  지금 본인의 투자 상태를 선택해 주세요.
                </p>
                <p className="mt-1 break-keep text-xs text-cohort-ink-50">
                  Cohort는 이미 본인만의 투자 plan이 있는 분들을 위한 서비스입니다.
                </p>
              </div>
              <RadioGroup
                name="q0_user_stage"
                value={form.q0_user_stage}
                onChange={(v) => set('q0_user_stage', v as Q0Stage)}
                options={Q0_OPTIONS}
              />
            </div>
          )}

          {/* ─── Graceful exit ─── */}
          {gracefulExit && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                지금 단계에서는 fit이 맞지 않습니다.
              </p>
              <GracefulExitScreen />
            </div>
          )}

          {/* ─── Step 1 — Q1 time horizon ─── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q1. 현재 운용 중인 포트폴리오의 목표 기간은?
              </p>
              <RadioGroup
                name="q1_time_horizon"
                value={form.q1_time_horizon}
                onChange={(v) => set('q1_time_horizon', v)}
                options={TIME_HORIZON_OPTIONS}
              />
            </div>
          )}

          {/* ─── Step 2 — Q3 macro freq ─── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q3. 매크로 데이터를 얼마나 자주 직접 확인하시나요?
              </p>
              <RadioGroup
                name="q3_macro_watching_freq"
                value={form.q3_macro_watching_freq}
                onChange={(v) => set('q3_macro_watching_freq', v)}
                options={MACRO_FREQ_OPTIONS}
              />
            </div>
          )}

          {/* ─── Step 3 — Q5 split buy ─── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q5. 분할매수 원칙이 있으신가요?
              </p>
              <RadioGroup
                name="q5_split_buy_enforcement"
                value={form.q5_split_buy_enforcement}
                onChange={(v) => set('q5_split_buy_enforcement', v)}
                options={SPLIT_BUY_OPTIONS}
              />
            </div>
          )}

          {/* ─── Step 4 — Q6 plan formalization ─── */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q6. 본인의 투자 plan은 어느 수준으로 정리되어 있나요?
              </p>
              <RadioGroup
                name="q6_plan_formalization"
                value={form.q6_plan_formalization}
                onChange={(v) => set('q6_plan_formalization', v)}
                options={PLAN_FORMALIZATION_OPTIONS}
              />
            </div>
          )}

          {/* ─── Step 5 — Q7 emotional decisions ─── */}
          {step === 5 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q7. 지난 12개월 동안 plan과 무관한 감정적 매매 결정을 몇 번 했나요?
              </p>
              <RadioGroup
                name="q7_emotional_decision_count_12m"
                value={form.q7_emotional_decision_count_12m}
                onChange={(v) => set('q7_emotional_decision_count_12m', v)}
                options={EMOTIONAL_DECISION_OPTIONS}
              />
            </div>
          )}

          {/* ─── Step 6 — Q8 framework + Q11 fallback ─── */}
          {step === 6 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q8. 본인의 투자 framework과 가장 가까운 것을 모두 선택해 주세요.
              </p>
              <MultiSelect
                values={form.q8_framework_affinity}
                onChange={(vs) => set('q8_framework_affinity', vs)}
                options={Q8_OPTIONS}
              />
              {showUnsureTextArea && (
                <TextArea
                  name="q11_framework_self_described"
                  label="본인의 방식을 자유롭게 설명해 주세요 (선택)"
                  placeholder="예: 분기마다 재무제표를 보고 장기 보유하는 편입니다"
                  value={form.q11_framework_self_described}
                  onChange={(v) => set('q11_framework_self_described', v)}
                />
              )}
            </div>
          )}

          {/* ─── Step 7 — Q9 weakness self-assessment ─── */}
          {step === 7 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q9. 본인이 가장 흔들리기 쉬운 상황을 1-2문장으로 적어주세요.
              </p>
              <p className="break-keep text-xs text-cohort-ink-50">
                입력하신 내용은 Cohort의 개인화 페이스 설정에만 활용됩니다.
              </p>
              <TextArea
                name="q9_weakness_self_assessment"
                placeholder="예: 시장이 -5% 이상 빠질 때 손절 충동이 강해진다"
                value={form.q9_weakness_self_assessment}
                onChange={(v) => set('q9_weakness_self_assessment', v)}
              />
            </div>
          )}

          {/* ─── Step 8 — Q10 target outcome ─── */}
          {step === 8 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q10. Cohort를 통해 가장 바라는 변화는 무엇인가요?
              </p>
              <TextArea
                name="q10_target_outcome"
                placeholder="예: 매크로 변화를 놓치지 않고 본인 plan대로 집행하고 싶다"
                value={form.q10_target_outcome}
                onChange={(v) => set('q10_target_outcome', v)}
              />
            </div>
          )}

          {/* Error display */}
          {error && (
            <p role="alert" className="mt-3 break-keep text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-cohort-ink-10 px-5 py-4">
          {gracefulExit ? (
            <Button onClick={onClose} variant="secondary">
              닫기
            </Button>
          ) : step === 0 ? (
            <Button
              onClick={handleQ0Next}
              disabled={!form.q0_user_stage}
              aria-disabled={!form.q0_user_stage}
            >
              다음
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleNext}
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? '저장 중…' : isLastStep ? '완료' : '다음'}
              </Button>
              <Button variant="secondary" onClick={handleBack} disabled={submitting}>
                이전
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
