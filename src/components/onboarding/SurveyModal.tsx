'use client';

import { useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { GlRtsQuestionStep } from '@/components/onboarding/survey/GlRtsQuestionStep';
import {
  GL_RTS_QUESTIONS,
  type GlRtsAnswers,
  type GlRtsOptionId,
} from '@/lib/profile/gl-rts-questions';
import {
  INFO_SOURCE_OPTIONS,
  PORTFOLIO_ASSET_KEYS,
  PORTFOLIO_ASSET_LABELS,
  type PortfolioAssetKey,
} from '@/lib/profile/survey-factual-options';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  gl_rts: GlRtsAnswers;
  q1_time_horizon: string;
  q2_portfolio_composition_pct: Record<PortfolioAssetKey, number>;
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

/** step 0=Q0, 1–13=GL-RTS, 14–23=factual Q1–Q10 */
const LAST_STEP = 23;
const GL_RTS_START = 1;
const FACTUAL_START = 14;

const EMPTY_PORTFOLIO = Object.fromEntries(
  PORTFOLIO_ASSET_KEYS.map((k) => [k, 0]),
) as Record<PortfolioAssetKey, number>;

// ── Graceful exit (Q0 learning) ─────────────────────────────────────────────

function GracefulExitScreen() {
  return (
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
        <strong className="text-cohort-ink-90">Valley / 이효석아카데미 / 김단테</strong>{' '}
        채널을 추천 영역에서 말씀드립니다. 학습을 마치신 후 다시 방문해 주세요.
        {/* OPTION-B-ALLOWED: 학습 리소스 안내 (교육 콘텐츠 — 투자 추천 아님) */}
      </p>
    </div>
  );
}

// ── Shared option lists ─────────────────────────────────────────────────────

const Q0_OPTIONS = [
  { value: 'learning', label: '(a) 투자 시작을 위한 학습이 진행 중' },
  {
    value: 'post_learning_planned',
    label: '(b) 학습이 끝났고 본인 plan이 있으며 운용을 진행 중',
  },
  {
    value: 'active_investor_enforcement',
    label: '(c) Active investor + plan + 매크로 + 분할매수 enforcement가 in place',
  },
];

const Q8_OPTIONS: { value: FrameworkValue; label: string }[] = [
  { value: 'druckenmiller_macro_13f', label: '드러켄밀러식 매크로 베팅 + 13F 클로닝' },
  { value: 'kimdante_macro_korea_us', label: '김단테식 매크로 분석 + 한미 cross-border' },
  { value: 'buffett_index_value', label: '버핏식 인덱스 적립 + value investing' },
  { value: 'dalio_all_weather', label: '달리오식 all-weather + risk parity' },
  { value: 'kostolany_psychology_cycle', label: '코스톨라니식 심리적 cycle' },
  { value: 'technical_fundamental', label: '기술적/기본적 분석 (chart + 재무 통합)' },
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

function FactualRadioStep({
  title,
  name,
  value,
  onChange,
  options,
}: {
  title: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <p className="break-keep text-base font-semibold text-cohort-ink-90">{title}</p>
      ) : null}
      <RadioGroup value={value} onValueChange={onChange} aria-label={title || name}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors motion-reduce:transition-none',
                selected
                  ? 'border-cohort-primary bg-cohort-primary/5'
                  : 'border-cohort-ink-10 bg-white',
              )}
            >
              <RadioGroupItem value={opt.value} id={`${name}-${opt.value}`} />
              <Label htmlFor={`${name}-${opt.value}`} className="flex-1 cursor-pointer font-normal">
                {opt.label}
              </Label>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function SurveyModal({ open, onClose, onComplete }: SurveyModalProps) {
  const [step, setStep] = useState(0);
  const [gracefulExit, setGracefulExit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    q0_user_stage: '',
    gl_rts: {},
    q1_time_horizon: '',
    q2_portfolio_composition_pct: { ...EMPTY_PORTFOLIO },
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

  const progressPct = useMemo(() => {
    if (step < GL_RTS_START) return 0;
    return Math.round((step / LAST_STEP) * 100);
  }, [step]);

  const stepLabel = useMemo(() => {
    if (step === 0) return '현재 상태 확인';
    if (step >= GL_RTS_START && step < FACTUAL_START) return '위험감수성 진단';
    return '투자 프로필';
  }, [step]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const glRtsIndex = step - GL_RTS_START;
  const glRtsQuestion =
    step >= GL_RTS_START && step < FACTUAL_START
      ? GL_RTS_QUESTIONS[glRtsIndex]
      : null;

  const showUnsureTextArea = form.q8_framework_affinity.includes('unsure');

  const portfolioSum = Object.values(form.q2_portfolio_composition_pct).reduce(
    (s, n) => s + (Number.isFinite(n) ? n : 0),
    0,
  );

  const canProceed = (): boolean => {
    if (gracefulExit) return true;
    if (step === 0) return !!form.q0_user_stage;
    if (glRtsQuestion) {
      const ans = form.gl_rts[glRtsQuestion.id];
      return !!ans;
    }
    switch (step) {
      case 14:
        return !!form.q1_time_horizon;
      case 15: {
        if (portfolioSum < 95 || portfolioSum > 105) return false;
        return Object.values(form.q2_portfolio_composition_pct).some((v) => v > 0);
      }
      case 16:
        return !!form.q3_macro_watching_freq;
      case 17:
        return form.q4_info_sources.length > 0;
      case 18:
        return !!form.q5_split_buy_enforcement;
      case 19:
        return !!form.q6_plan_formalization;
      case 20:
        return !!form.q7_emotional_decision_count_12m;
      case 21:
        return form.q8_framework_affinity.length > 0;
      case 22:
        return form.q9_weakness_self_assessment.trim().length > 0;
      case 23:
        return form.q10_target_outcome.trim().length > 0;
      default:
        return false;
    }
  };

  const handleQ0Next = () => {
    if (!form.q0_user_stage) return;
    if (form.q0_user_stage === 'learning') {
      setGracefulExit(true);
      void fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q0_user_stage: 'learning' }),
      });
    } else {
      setStep(GL_RTS_START);
    }
  };

  const handleBack = () => {
    setError(null);
    setPortfolioError(null);
    if (step > GL_RTS_START) setStep((s) => s - 1);
    else if (step === GL_RTS_START) setStep(0);
  };

  const handleNext = () => {
    setError(null);
    if (step === 15) {
      if (portfolioSum < 95 || portfolioSum > 105) {
        setPortfolioError('자산 비중 합계는 100% ±5% (95–105%)여야 합니다.');
        return;
      }
      setPortfolioError(null);
    }
    if (step < LAST_STEP) setStep((s) => s + 1);
    else void handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const portfolioPayload = Object.fromEntries(
      Object.entries(form.q2_portfolio_composition_pct).filter(([, v]) => v > 0),
    );

    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q0_user_stage: form.q0_user_stage,
          gl_rts_answers: form.gl_rts,
          q1_time_horizon: form.q1_time_horizon,
          q2_portfolio_composition_pct: portfolioPayload,
          q3_macro_watching_freq: form.q3_macro_watching_freq,
          q4_info_sources: form.q4_info_sources,
          q5_split_buy_enforcement: form.q5_split_buy_enforcement,
          q6_plan_formalization: form.q6_plan_formalization,
          q7_emotional_decision_count_12m: form.q7_emotional_decision_count_12m,
          q8_framework_affinity: form.q8_framework_affinity,
          q9_weakness_self_assessment: form.q9_weakness_self_assessment,
          q10_target_outcome: form.q10_target_outcome,
          q11_framework_self_described: showUnsureTextArea
            ? form.q11_framework_self_described || undefined
            : undefined,
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

  const isLastStep = step === LAST_STEP;

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
        <div className="border-b border-cohort-ink-10 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-cohort-ink-90">
              {stepLabel}
              {!gracefulExit && step > 0 ? ` · ${step}/${LAST_STEP}` : ''}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-cohort-ink-50 hover:text-cohort-ink-90"
              aria-label="설문 닫기"
            >
              ✕
            </button>
          </div>
          {!gracefulExit && step >= GL_RTS_START && (
            <Progress value={progressPct} className="mt-3" aria-label="설문 진행률" />
          )}
        </div>

        <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: '70vh' }}>
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
              <FactualRadioStep
                title=""
                name="q0_user_stage"
                value={form.q0_user_stage}
                onChange={(v) => set('q0_user_stage', v as Q0Stage)}
                options={Q0_OPTIONS}
              />
            </div>
          )}

          {gracefulExit && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                지금 단계에서는 fit이 맞지 않습니다.
              </p>
              <GracefulExitScreen />
            </div>
          )}

          {glRtsQuestion && (
            <GlRtsQuestionStep
              question={glRtsQuestion}
              value={form.gl_rts[glRtsQuestion.id] ?? ''}
              onChange={(v) =>
                set('gl_rts', { ...form.gl_rts, [glRtsQuestion.id]: v as GlRtsOptionId })
              }
            />
          )}

          {step === 14 && (
            <FactualRadioStep
              title="Q1. 현재 운용 중인 포트폴리오의 목표 기간은?"
              name="q1_time_horizon"
              value={form.q1_time_horizon}
              onChange={(v) => set('q1_time_horizon', v)}
              options={TIME_HORIZON_OPTIONS}
            />
          )}

          {step === 15 && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="break-keep text-base font-semibold text-cohort-ink-90">
                  Q2. 현재 포트폴리오 구성 (비율만, % 합계 100% ±5)
                </p>
                <p className="mt-1 break-keep text-xs text-cohort-ink-50">
                  절대 금액은 수집하지 않습니다. 자산군별 비중만 입력해 주세요.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {PORTFOLIO_ASSET_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label htmlFor={`portfolio-${key}`} className="min-w-[120px] flex-1">
                      {PORTFOLIO_ASSET_LABELS[key]}
                    </Label>
                    <input
                      id={`portfolio-${key}`}
                      type="number"
                      min={0}
                      max={100}
                      inputMode="numeric"
                      value={form.q2_portfolio_composition_pct[key] || ''}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        set('q2_portfolio_composition_pct', {
                          ...form.q2_portfolio_composition_pct,
                          [key]: Number.isFinite(n) ? n : 0,
                        });
                      }}
                      className="h-[44px] w-20 rounded-xl border border-cohort-ink-10 px-3 text-right text-sm focus:border-cohort-primary focus:outline-none focus:ring-2 focus:ring-cohort-primary/20"
                      aria-label={`${PORTFOLIO_ASSET_LABELS[key]} 비중`}
                    />
                    <span className="text-sm text-cohort-ink-50">%</span>
                  </div>
                ))}
              </div>
              <p
                className={cn(
                  'text-xs',
                  portfolioSum >= 95 && portfolioSum <= 105
                    ? 'text-cohort-success'
                    : 'text-cohort-ink-50',
                )}
              >
                합계: {portfolioSum}% {portfolioSum >= 95 && portfolioSum <= 105 ? '✓' : '(95–105% 필요)'}
              </p>
              {portfolioError && (
                <p role="alert" className="text-sm text-red-600">
                  {portfolioError}
                </p>
              )}
            </div>
          )}

          {step === 16 && (
            <FactualRadioStep
              title="Q3. 매크로 데이터를 얼마나 자주 직접 확인하시나요?"
              name="q3_macro_watching_freq"
              value={form.q3_macro_watching_freq}
              onChange={(v) => set('q3_macro_watching_freq', v)}
              options={MACRO_FREQ_OPTIONS}
            />
          )}

          {step === 17 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q4. 투자 정보를 주로 어디서 얻으시나요? (복수 선택)
              </p>
              <div className="flex flex-col gap-3">
                {INFO_SOURCE_OPTIONS.map((opt) => {
                  const checked = form.q4_info_sources.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors motion-reduce:transition-none',
                        checked
                          ? 'border-cohort-primary bg-cohort-primary/5'
                          : 'border-cohort-ink-10 bg-white',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          if (c) {
                            set('q4_info_sources', [...form.q4_info_sources, opt.value]);
                          } else {
                            set(
                              'q4_info_sources',
                              form.q4_info_sources.filter((x) => x !== opt.value),
                            );
                          }
                        }}
                        id={`info-${opt.value}`}
                      />
                      <Label htmlFor={`info-${opt.value}`} className="flex-1 cursor-pointer font-normal">
                        {opt.label}
                      </Label>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 18 && (
            <FactualRadioStep
              title="Q5. 분할매수 원칙이 있으신가요?"
              name="q5_split_buy_enforcement"
              value={form.q5_split_buy_enforcement}
              onChange={(v) => set('q5_split_buy_enforcement', v)}
              options={SPLIT_BUY_OPTIONS}
            />
          )}

          {step === 19 && (
            <FactualRadioStep
              title="Q6. 본인의 투자 plan은 어느 수준으로 정리되어 있나요?"
              name="q6_plan_formalization"
              value={form.q6_plan_formalization}
              onChange={(v) => set('q6_plan_formalization', v)}
              options={PLAN_FORMALIZATION_OPTIONS}
            />
          )}

          {step === 20 && (
            <FactualRadioStep
              title="Q7. 지난 12개월 동안 plan과 무관한 감정적 매매 결정을 몇 번 했나요?"
              name="q7_emotional_decision_count_12m"
              value={form.q7_emotional_decision_count_12m}
              onChange={(v) => set('q7_emotional_decision_count_12m', v)}
              options={EMOTIONAL_DECISION_OPTIONS}
            />
          )}

          {step === 21 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q8. 본인의 투자 framework과 가장 가까운 것을 모두 선택해 주세요.
              </p>
              <div className="flex flex-col gap-3">
                {Q8_OPTIONS.map((opt) => {
                  const checked = form.q8_framework_affinity.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors motion-reduce:transition-none',
                        checked
                          ? 'border-cohort-primary bg-cohort-primary/5'
                          : 'border-cohort-ink-10 bg-white',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          if (c) {
                            set('q8_framework_affinity', [
                              ...form.q8_framework_affinity,
                              opt.value,
                            ]);
                          } else {
                            set(
                              'q8_framework_affinity',
                              form.q8_framework_affinity.filter((x) => x !== opt.value),
                            );
                          }
                        }}
                        id={`fw-${opt.value}`}
                      />
                      <Label htmlFor={`fw-${opt.value}`} className="flex-1 cursor-pointer font-normal">
                        {opt.label}
                      </Label>
                    </label>
                  );
                })}
              </div>
              {showUnsureTextArea && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="q11_framework_self_described">
                    본인의 방식을 자유롭게 설명해 주세요 (선택)
                  </Label>
                  <Textarea
                    id="q11_framework_self_described"
                    placeholder="예: 분기마다 재무제표를 보고 장기 보유하는 편입니다"
                    value={form.q11_framework_self_described}
                    onChange={(e) => set('q11_framework_self_described', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {step === 22 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q9. 본인이 가장 흔들리기 쉬운 상황을 1-2문장으로 적어주세요.
              </p>
              <p className="break-keep text-xs text-cohort-ink-50">
                입력하신 내용은 Cohort의 개인화 페이스 설정에만 활용됩니다.
              </p>
              <Textarea
                name="q9_weakness_self_assessment"
                placeholder="예: 시장이 -5% 이상 빠질 때 손절 충동이 강해진다"
                value={form.q9_weakness_self_assessment}
                onChange={(e) => set('q9_weakness_self_assessment', e.target.value)}
              />
            </div>
          )}

          {step === 23 && (
            <div className="flex flex-col gap-4">
              <p className="break-keep text-base font-semibold text-cohort-ink-90">
                Q10. Cohort를 통해 가장 바라는 변화는 무엇인가요?
              </p>
              <Textarea
                name="q10_target_outcome"
                placeholder="예: 매크로 변화를 놓치지 않고 본인 plan대로 집행하고 싶다"
                value={form.q10_target_outcome}
                onChange={(e) => set('q10_target_outcome', e.target.value)}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 break-keep text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

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
                disabled={submitting || !canProceed()}
                aria-busy={submitting}
                aria-disabled={!canProceed()}
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
