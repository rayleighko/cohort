'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import MascotAvatar from '@/components/mascot/MascotAvatar';
import { AllocationTargetRow } from '@/components/ips/AllocationTargetRow';
import { IpsLabelWithHelp } from '@/components/ips/IpsHelpTip';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { sumAllocationWeights } from '@/domains/principle/domain/ips-schema';
import { buildIpsDocumentFromDraft } from '@/lib/ips/build-document';
import {
  CONTRIBUTION_BAND_OPTIONS,
  HORIZON_BAND_OPTIONS,
  IPS_STEP_IDS,
  IPS_STEP_TITLES,
  LOSS_LIMIT_ACTION_OPTIONS,
  PLAN_FORMALIZATION_HINTS,
  REBALANCE_CADENCE_OPTIONS,
  REVIEW_CADENCE_OPTIONS,
  type IpsStepId,
} from '@/lib/ips/labels';
import { hasAllocationMismatch, createInitialDraft } from '@/lib/ips/prefill';
import {
  DRAWDOWN_HELP_TEXT,
  PRE_COMMITMENT_INTRO,
  PRE_COMMITMENT_TEMPLATES,
} from '@/lib/ips/precommitment-templates';
import type { IpsProfilePrefill, IpsWizardDraft } from '@/lib/ips/wizard-types';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'cohort-ips-document-v0.1';

const CHOICE_LABEL = cn(
  'flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm leading-snug transition-colors motion-reduce:transition-none',
);

interface IpsWizardShellProps {
  prefill?: IpsProfilePrefill;
  actualAllocationPct?: Record<string, number> | null;
  planFormalization?: string | null;
}

function validateStep(step: IpsStepId, draft: IpsWizardDraft): string | null {
  switch (step) {
    case 'horizon':
      return draft.horizon.yearsBand ? null : '투자 기간을 선택해 주세요.';
    case 'allocation': {
      const sum = sumAllocationWeights(draft.allocation.targets);
      if (draft.allocation.targets.length < 1) return '자산군을 1개 이상 입력해 주세요.';
      if (Math.abs(sum - 100) > 0.01) {
        return `목표 배분 합계가 100%여야 합니다 (현재 ${sum.toFixed(1)}%).`;
      }
      return null;
    }
    case 'loss_limit':
      if (draft.lossLimit.maxDrawdownReviewPct < 1 || draft.lossLimit.maxDrawdownReviewPct > 50) {
        return '손실 한계는 1–50% 사이로 입력해 주세요.';
      }
      if (!draft.lossLimit.action) return '검토 시 행동을 선택해 주세요.';
      if (draft.lossLimit.action === 'custom_note' && !draft.lossLimit.customNote.trim()) {
        return '본인 메모를 입력해 주세요.';
      }
      return null;
    case 'pace':
      return draft.pace.monthlyContributionBand ? null : '추가 투자 페이스를 선택해 주세요.';
    case 'rebalance':
      if (draft.rebalance.driftThresholdPct < 1 || draft.rebalance.driftThresholdPct > 25) {
        return '편차 임계치는 1–25% 사이로 입력해 주세요.';
      }
      return draft.rebalance.cadence ? null : '리밸런싱 주기를 선택해 주세요.';
    case 'review':
      if (!draft.review.cadence) return '복기 주기를 선택해 주세요.';
      if (!draft.review.preCommitmentTemplateId) {
        return '아래에서 시작 문장을 고르거나 직접 작성을 선택해 주세요.';
      }
      if (draft.review.preCommitmentText.trim().length < 20) {
        return '한 문장을 20자 이상 작성해 주세요. 선택한 문장을 고쳐 쓰셔도 됩니다.';
      }
      return null;
    default:
      return null;
  }
}

function RadioChoices<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T | '';
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} name={name}>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <Label
            key={opt.value}
            htmlFor={`${name}-${opt.value}`}
            className={cn(
              CHOICE_LABEL,
              value === opt.value
                ? 'border-cohort-primary bg-cohort-primary/5'
                : 'border-cohort-ink-10 bg-white',
            )}
          >
            <RadioGroupItem id={`${name}-${opt.value}`} value={opt.value} />
            <span className="break-keep">{opt.label}</span>
          </Label>
        ))}
      </div>
    </RadioGroup>
  );
}

export default function IpsWizardShell({
  prefill,
  actualAllocationPct,
  planFormalization,
}: IpsWizardShellProps) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<IpsWizardDraft>(() => createInitialDraft(prefill));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = IPS_STEP_IDS[stepIdx]!;
  const progressPct = ((stepIdx + 1) / IPS_STEP_IDS.length) * 100;

  const allocationSum = useMemo(
    () => sumAllocationWeights(draft.allocation.targets),
    [draft.allocation.targets],
  );

  const showMismatch = useMemo(
    () => hasAllocationMismatch(actualAllocationPct, draft.allocation.targets),
    [actualAllocationPct, draft.allocation.targets],
  );

  const planHint =
    planFormalization && PLAN_FORMALIZATION_HINTS[planFormalization]
      ? PLAN_FORMALIZATION_HINTS[planFormalization]
      : null;

  const updateTarget = useCallback(
    (
      index: number,
      patch: Partial<{
        assetClass: IpsWizardDraft['allocation']['targets'][0]['assetClass'];
        weightPct: number;
      }>,
    ) => {
      setDraft((d) => {
        const targets = [...d.allocation.targets];
        targets[index] = { ...targets[index]!, ...patch };
        return { ...d, allocation: { targets } };
      });
    },
    [],
  );

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    const doc = buildIpsDocumentFromDraft(draft);
    if (!doc) {
      setError('입력 내용을 확인해 주세요.');
      setSubmitting(false);
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      router.push('/settings?ips=saved');
      router.refresh();
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    const err = validateStep(step, draft);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (stepIdx < IPS_STEP_IDS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      void handleComplete();
    }
  };

  const goBack = () => {
    setError(null);
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col pb-28">
      <header className="sticky top-0 z-10 border-b border-cohort-ink-10 bg-cohort-ivory px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm text-cohort-ink-50"
          >
            ← 설정
          </Link>
          <p className="min-w-0 truncate text-sm font-semibold text-cohort-ink-90">
            투자 원칙 (IPS) · {stepIdx + 1}/{IPS_STEP_IDS.length}
          </p>
          <span className="w-10" aria-hidden />
        </div>
        <Progress value={progressPct} className="mt-2 h-1" aria-label="IPS 작성 진행률" />
      </header>

      <div className="flex-1 px-4 py-4">
        <div className="mb-4 flex items-start gap-2">
          <MascotAvatar character="aurora" state="calm" size={36} />
          <p className="text-sm leading-relaxed text-cohort-charcoal/75 break-keep">
            <span className="font-semibold text-cohort-primary">Aurora 🕊</span>{' '}
            평온할 때 정해 둔 본인 plan이, 흔들릴 때 돌아갈 자리예요. 코호트는
            매수·매도나 비중을 제안하지 않고, 본인이 쓴 원칙만 정리해 드려요.
          </p>
        </div>

        <h2 className="text-base font-semibold text-cohort-charcoal break-keep">
          {IPS_STEP_TITLES[step]}
        </h2>

        {stepIdx === 0 && planHint && (
          <p className="mt-2 text-xs leading-relaxed text-cohort-charcoal/55 break-keep">
            {planHint}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {step === 'horizon' && (
            <>
              <RadioChoices
                name="horizon-band"
                value={draft.horizon.yearsBand}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, horizon: { ...d.horizon, yearsBand: v } }))
                }
                options={HORIZON_BAND_OPTIONS}
              />
              <div>
                <Label htmlFor="horizon-note" className="text-xs text-cohort-ink-50">
                  메모 (선택)
                </Label>
                <Textarea
                  id="horizon-note"
                  value={draft.horizon.note}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, horizon: { ...d.horizon, note: e.target.value } }))
                  }
                  className="mt-1 min-h-[80px] resize-none"
                  maxLength={500}
                  placeholder="예: 은퇴 전까지 장기 적립"
                />
              </div>
            </>
          )}

          {step === 'allocation' && (
            <>
              <p className="text-xs leading-relaxed text-cohort-ink-50 break-keep">
                목표 비중만 입력해 주세요. 절대 금액은 수집하지 않습니다.
              </p>
              {showMismatch && (
                <p className="rounded-xl border border-cohort-warning/30 bg-cohort-warning/5 px-3 py-2 text-xs leading-relaxed text-cohort-charcoal/70 break-keep">
                  설문에 기록한 <strong>현재</strong> 배분과 지금 적는{' '}
                  <strong>목표</strong> 배분이 다를 수 있어요. 본인 plan 기준으로
                  목표만 정하시면 됩니다.
                </p>
              )}
              <div className="flex flex-col gap-3">
                {draft.allocation.targets.map((t, i) => (
                  <AllocationTargetRow
                    key={`${t.assetClass}-${i}`}
                    assetClass={t.assetClass}
                    weightPct={t.weightPct}
                    canRemove={draft.allocation.targets.length > 1}
                    onAssetChange={(assetClass) => updateTarget(i, { assetClass })}
                    onWeightChange={(weightPct) => updateTarget(i, { weightPct })}
                    onRemove={() =>
                      setDraft((d) => ({
                        ...d,
                        allocation: {
                          targets: d.allocation.targets.filter((_, j) => j !== i),
                        },
                      }))
                    }
                  />
                ))}
              </div>
              {draft.allocation.targets.length < 8 && (
                <button
                  type="button"
                  className="min-h-[44px] text-sm text-cohort-primary"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      allocation: {
                        targets: [...d.allocation.targets, { assetClass: 'cash', weightPct: 0 }],
                      },
                    }))
                  }
                >
                  + 자산군 추가
                </button>
              )}
              <p
                className={cn(
                  'text-xs',
                  Math.abs(allocationSum - 100) <= 0.01
                    ? 'text-cohort-success'
                    : 'text-cohort-ink-50',
                )}
              >
                합계: {allocationSum.toFixed(1)}%
                {Math.abs(allocationSum - 100) <= 0.01 ? ' ✓' : ' (100% 필요)'}
              </p>
            </>
          )}

          {step === 'loss_limit' && (
            <>
              <div>
                <IpsLabelWithHelp
                  htmlFor="drawdown-pct"
                  title={
                    <>
                      고점 대비 하락 폭{' '}
                      <span className="font-normal text-cohort-ink-50">(drawdown, %)</span>
                    </>
                  }
                  helpLabel="Drawdown(낙폭) 설명"
                  helpText={DRAWDOWN_HELP_TEXT}
                />
                <input
                  id="drawdown-pct"
                  type="number"
                  min={1}
                  max={50}
                  inputMode="numeric"
                  value={draft.lossLimit.maxDrawdownReviewPct}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      lossLimit: {
                        ...d.lossLimit,
                        maxDrawdownReviewPct: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="mt-1 h-[44px] w-full max-w-[8rem] rounded-xl border border-cohort-ink-10 px-3 text-center text-sm tabular-nums focus:border-cohort-primary focus:outline-none focus:ring-2 focus:ring-cohort-primary/20"
                />
              </div>
              <RadioChoices
                name="loss-action"
                value={draft.lossLimit.action}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, lossLimit: { ...d.lossLimit, action: v } }))
                }
                options={LOSS_LIMIT_ACTION_OPTIONS}
              />
              {draft.lossLimit.action === 'custom_note' && (
                <Textarea
                  value={draft.lossLimit.customNote}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      lossLimit: { ...d.lossLimit, customNote: e.target.value },
                    }))
                  }
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                  placeholder="본인 plan에 따른 행동을 적어 주세요"
                />
              )}
            </>
          )}

          {step === 'pace' && (
            <>
              <RadioChoices
                name="contribution-band"
                value={draft.pace.monthlyContributionBand}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, pace: { ...d.pace, monthlyContributionBand: v } }))
                }
                options={CONTRIBUTION_BAND_OPTIONS}
              />
              <div>
                <Label htmlFor="split-buy" className="text-xs text-cohort-ink-50">
                  분할매수 · 페이스 메모 (선택)
                </Label>
                <Textarea
                  id="split-buy"
                  value={draft.pace.splitBuyRule}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, pace: { ...d.pace, splitBuyRule: e.target.value } }))
                  }
                  className="mt-1 min-h-[80px] resize-none"
                  maxLength={500}
                  placeholder="예: 월 2회, 지정 요일에만 추가 매수"
                />
              </div>
            </>
          )}

          {step === 'rebalance' && (
            <>
              <div>
                <Label htmlFor="drift-threshold" className="text-sm break-keep">
                  목표 대비 편차 임계치 (%)
                </Label>
                <input
                  id="drift-threshold"
                  type="number"
                  min={1}
                  max={25}
                  inputMode="numeric"
                  value={draft.rebalance.driftThresholdPct}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      rebalance: {
                        ...d.rebalance,
                        driftThresholdPct: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="mt-1 h-[44px] w-full rounded-xl border border-cohort-ink-10 px-3 text-sm"
                />
              </div>
              <RadioChoices
                name="rebalance-cadence"
                value={draft.rebalance.cadence}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, rebalance: { ...d.rebalance, cadence: v } }))
                }
                options={REBALANCE_CADENCE_OPTIONS}
              />
            </>
          )}

          {step === 'review' && (
            <>
              <RadioChoices
                name="review-cadence"
                value={draft.review.cadence}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, review: { ...d.review, cadence: v } }))
                }
                options={REVIEW_CADENCE_OPTIONS}
              />
              <div className="border-t border-cohort-ink-10 pt-4">
                <p className="text-sm font-medium text-cohort-charcoal break-keep">
                  흔들릴 때 다시 읽을 한 문장
                </p>
                <p className="mt-1 text-xs leading-relaxed text-cohort-ink-50 break-keep">
                  {PRE_COMMITMENT_INTRO}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {PRE_COMMITMENT_TEMPLATES.map((template) => {
                    const selected = draft.review.preCommitmentTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            review: {
                              ...d.review,
                              preCommitmentTemplateId: template.id,
                              preCommitmentText:
                                template.id === 'custom' ? '' : template.text,
                            },
                          }))
                        }
                        className={cn(
                          'min-h-[44px] rounded-xl border px-3 py-2.5 text-left transition-colors motion-reduce:transition-none',
                          selected
                            ? 'border-cohort-primary bg-cohort-primary/5'
                            : 'border-cohort-ink-10 bg-white',
                        )}
                      >
                        <span className="block text-sm font-medium text-cohort-charcoal break-keep">
                          {template.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-cohort-ink-50 break-keep">
                          {template.source}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {draft.review.preCommitmentTemplateId && (
                  <div className="mt-3">
                    <Label htmlFor="pre-commitment" className="text-xs text-cohort-ink-50">
                      {draft.review.preCommitmentTemplateId === 'custom'
                        ? '본인 문장 (20자 이상)'
                        : '선택한 문장 — 필요하면 고쳐 쓰세요'}
                    </Label>
                    <Textarea
                      id="pre-commitment"
                      value={draft.review.preCommitmentText}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          review: { ...d.review, preCommitmentText: e.target.value },
                        }))
                      }
                      className="mt-1 min-h-[120px] resize-none"
                      maxLength={2000}
                      placeholder={
                        draft.review.preCommitmentTemplateId === 'custom'
                          ? '예: 급한 날에는 plan만 확인하고, 본인이 정한 페이스를 우선한다.'
                          : undefined
                      }
                    />
                    <p className="mt-1 text-xs text-cohort-ink-50">
                      {draft.review.preCommitmentText.trim().length} / 20자 이상
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-cohort-primary break-keep">
            {error}
          </p>
        )}
      </div>

      <footer className="fixed bottom-16 left-0 right-0 z-20 border-t border-cohort-ink-10 bg-cohort-ivory px-4 py-3">
        <div className="mx-auto flex max-w-md gap-2">
          {stepIdx > 0 && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={goBack}
              disabled={submitting}
            >
              이전
            </Button>
          )}
          <Button type="button" className="flex-1" onClick={goNext} disabled={submitting}>
            {stepIdx === IPS_STEP_IDS.length - 1
              ? submitting
                ? '저장 중…'
                : '원칙 저장'
              : '다음'}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-md text-center text-[10px] leading-relaxed text-cohort-charcoal/45 break-keep">
          정보 제공 + 의사결정 지원 도구이며, 투자 추천·권장 서비스가 아닙니다.{/* OPTION-B-ALLOWED */}
        </p>
      </footer>
    </div>
  );
}
