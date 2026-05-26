'use client';

/**
 * Shape C — TriggerForm (W4 Tue)
 *
 * Mobile-first trigger creation form.
 * V1 active: price_drop + macro_composite
 * V1.5 disabled: disclosure + composite
 *
 * Design: 44px+ touch targets, vault 40-42 token strict
 * Strategic constraint: Option B — NEVER timing/buy advice in labels or placeholders
 * Vault refs: vault 62 §2, vault 56 D9
 */

import { useState } from 'react';
import type {
  TriggerType,
  PriceDropCondition,
  MacroCompositeCondition,
} from '@/types/trigger';

// ── Types ────────────────────────────────────────────────────────────────────

interface TriggerFormProps {
  onSubmit: (payload: {
    trigger_type: TriggerType;
    condition_params: PriceDropCondition | MacroCompositeCondition;
    cooldown_hours: number;
    label: string | null;
  }) => Promise<void>;
  isLoading?: boolean;
}

interface FormError {
  field: string;
  message: string;
}

// ── Sub-form state ────────────────────────────────────────────────────────────

interface PriceDropParams {
  ticker: string;
  threshold_pct: string;
  window_hours: string;
}

interface MacroCompositeParams {
  direction: 'above' | 'below';
  threshold: string;
}

const PRICE_DROP_DEFAULTS: PriceDropParams = {
  ticker: '',
  threshold_pct: '',
  window_hours: '24',
};

const MACRO_COMPOSITE_DEFAULTS: MacroCompositeParams = {
  direction: 'below',
  threshold: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TriggerForm({ onSubmit, isLoading = false }: TriggerFormProps) {
  const [triggerType, setTriggerType] = useState<TriggerType>('price_drop');
  const [cooldownHours, setCooldownHours] = useState<string>('24');
  const [label, setLabel] = useState<string>('');
  const [priceDropParams, setPriceDropParams] = useState<PriceDropParams>(PRICE_DROP_DEFAULTS);
  const [macroCompositeParams, setMacroCompositeParams] = useState<MacroCompositeParams>(
    MACRO_COMPOSITE_DEFAULTS,
  );
  const [errors, setErrors] = useState<FormError[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): FormError[] {
    const errs: FormError[] = [];

    const cooldown = Number(cooldownHours);
    if (!cooldownHours || isNaN(cooldown) || cooldown < 1 || cooldown > 168) {
      errs.push({ field: 'cooldown_hours', message: '쿨다운은 1-168시간 사이여야 합니다.' });
    }

    if (triggerType === 'price_drop') {
      if (!priceDropParams.ticker.trim()) {
        errs.push({ field: 'ticker', message: '티커를 입력해 주세요.' });
      }
      const pct = Number(priceDropParams.threshold_pct);
      if (!priceDropParams.threshold_pct || isNaN(pct) || pct <= 0 || pct > 100) {
        errs.push({ field: 'threshold_pct', message: '하락률은 0-100% 사이로 입력해 주세요.' });
      }
      const hours = Number(priceDropParams.window_hours);
      if (!priceDropParams.window_hours || isNaN(hours) || hours < 1 || hours > 720) {
        errs.push({ field: 'window_hours', message: '관찰 기간은 1-720시간 사이여야 합니다.' });
      }
    }

    if (triggerType === 'macro_composite') {
      const threshold = Number(macroCompositeParams.threshold);
      if (
        !macroCompositeParams.threshold ||
        isNaN(threshold) ||
        threshold < 0 ||
        threshold > 100
      ) {
        errs.push({ field: 'threshold', message: '임계값은 0-100 사이로 입력해 주세요.' });
      }
    }

    return errs;
  }

  function getFieldError(field: string): string | undefined {
    return errors.find((e) => e.field === field)?.message;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    let condition_params: PriceDropCondition | MacroCompositeCondition;

    if (triggerType === 'price_drop') {
      condition_params = {
        ticker: priceDropParams.ticker.trim().toUpperCase(),
        threshold_pct: Number(priceDropParams.threshold_pct),
        window_hours: Number(priceDropParams.window_hours),
      };
    } else {
      // macro_composite
      condition_params = {
        direction: macroCompositeParams.direction,
        threshold: Number(macroCompositeParams.threshold),
      };
    }

    try {
      await onSubmit({
        trigger_type: triggerType,
        condition_params,
        cooldown_hours: Number(cooldownHours),
        label: label.trim() || null,
      });

      // Reset form on success
      setTriggerType('price_drop');
      setCooldownHours('24');
      setLabel('');
      setPriceDropParams(PRICE_DROP_DEFAULTS);
      setMacroCompositeParams(MACRO_COMPOSITE_DEFAULTS);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '트리거 저장에 실패했습니다.');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const inputBase =
    'w-full rounded-lg border border-ink-30 bg-white px-4 py-3 text-sm text-ink-90 placeholder-ink-30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]';
  const labelBase = 'block text-sm font-medium text-ink-70 mb-1';
  const errorBase = 'mt-1 text-xs text-danger';
  const sectionTitle = 'text-xs font-semibold text-ink-50 uppercase tracking-wide mb-3';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* ── Trigger type selection ─────────────────────────────────────────── */}
      <fieldset>
        <legend className={sectionTitle}>트리거 유형</legend>
        <div className="grid grid-cols-2 gap-2">
          {/* V1 active */}
          {(
            [
              { value: 'price_drop', label: '가격 하락', active: true },
              { value: 'macro_composite', label: '매크로 복합', active: true },
              { value: 'disclosure', label: '공시 (V1.5)', active: false },
              { value: 'composite', label: '복합 조건 (V1.5)', active: false },
            ] as { value: TriggerType; label: string; active: boolean }[]
          ).map(({ value, label: optLabel, active }) => (
            <button
              key={value}
              type="button"
              disabled={!active}
              onClick={() => {
                if (active) {
                  setTriggerType(value);
                  setErrors([]);
                }
              }}
              className={[
                'flex items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors min-h-[44px]',
                !active
                  ? 'cursor-not-allowed border-ink-10 bg-ink-05 text-ink-30'
                  : triggerType === value
                    ? 'border-primary bg-primary text-white'
                    : 'border-ink-20 bg-white text-ink-70 hover:border-primary hover:text-primary',
              ].join(' ')}
            >
              {optLabel}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── price_drop params ─────────────────────────────────────────────── */}
      {triggerType === 'price_drop' && (
        <fieldset className="flex flex-col gap-4">
          <legend className={sectionTitle}>가격 하락 조건</legend>

          <div>
            <label htmlFor="ticker" className={labelBase}>
              티커 <span className="text-danger">*</span>
            </label>
            <input
              id="ticker"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              placeholder="예: AAPL, 005930"
              value={priceDropParams.ticker}
              onChange={(e) =>
                setPriceDropParams((p) => ({ ...p, ticker: e.target.value }))
              }
              className={inputBase}
              aria-invalid={!!getFieldError('ticker')}
              aria-describedby={getFieldError('ticker') ? 'ticker-error' : undefined}
            />
            {getFieldError('ticker') && (
              <p id="ticker-error" className={errorBase} role="alert">
                {getFieldError('ticker')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="threshold_pct" className={labelBase}>
              하락률 (%) <span className="text-danger">*</span>
            </label>
            <input
              id="threshold_pct"
              type="number"
              inputMode="decimal"
              min={0.1}
              max={100}
              step={0.1}
              placeholder="예: 5"
              value={priceDropParams.threshold_pct}
              onChange={(e) =>
                setPriceDropParams((p) => ({ ...p, threshold_pct: e.target.value }))
              }
              className={inputBase}
              aria-invalid={!!getFieldError('threshold_pct')}
              aria-describedby={
                getFieldError('threshold_pct') ? 'threshold-pct-error' : undefined
              }
            />
            {getFieldError('threshold_pct') && (
              <p id="threshold-pct-error" className={errorBase} role="alert">
                {getFieldError('threshold_pct')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="window_hours" className={labelBase}>
              관찰 기간 (시간) <span className="text-danger">*</span>
            </label>
            <input
              id="window_hours"
              type="number"
              inputMode="numeric"
              min={1}
              max={720}
              step={1}
              placeholder="예: 24"
              value={priceDropParams.window_hours}
              onChange={(e) =>
                setPriceDropParams((p) => ({ ...p, window_hours: e.target.value }))
              }
              className={inputBase}
              aria-invalid={!!getFieldError('window_hours')}
              aria-describedby={
                getFieldError('window_hours') ? 'window-hours-error' : undefined
              }
            />
            {getFieldError('window_hours') && (
              <p id="window-hours-error" className={errorBase} role="alert">
                {getFieldError('window_hours')}
              </p>
            )}
          </div>
        </fieldset>
      )}

      {/* ── macro_composite params ─────────────────────────────────────────── */}
      {triggerType === 'macro_composite' && (
        <fieldset className="flex flex-col gap-4">
          <legend className={sectionTitle}>매크로 복합 조건</legend>

          <div>
            <label htmlFor="macro-direction" className={labelBase}>
              방향 <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'below', label: '이하 (하락)' },
                  { value: 'above', label: '이상 (상승)' },
                ] as { value: 'above' | 'below'; label: string }[]
              ).map(({ value, label: dirLabel }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setMacroCompositeParams((p) => ({ ...p, direction: value }))
                  }
                  className={[
                    'flex items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors min-h-[44px]',
                    macroCompositeParams.direction === value
                      ? value === 'below'
                        ? 'border-vesper bg-vesper text-white'
                        : 'border-aurora-calm bg-aurora-calm text-white'
                      : 'border-ink-20 bg-white text-ink-70 hover:border-primary hover:text-primary',
                  ].join(' ')}
                  aria-pressed={macroCompositeParams.direction === value}
                >
                  {dirLabel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="macro-threshold" className={labelBase}>
              매크로 스코어 임계값 (0–100) <span className="text-danger">*</span>
            </label>
            <input
              id="macro-threshold"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              placeholder="예: 40"
              value={macroCompositeParams.threshold}
              onChange={(e) =>
                setMacroCompositeParams((p) => ({ ...p, threshold: e.target.value }))
              }
              className={inputBase}
              aria-invalid={!!getFieldError('threshold')}
              aria-describedby={getFieldError('threshold') ? 'threshold-error' : undefined}
            />
            {getFieldError('threshold') && (
              <p id="threshold-error" className={errorBase} role="alert">
                {getFieldError('threshold')}
              </p>
            )}
            <p className="mt-1 text-xs text-ink-50">
              스코어가 설정 임계값{' '}
              {macroCompositeParams.direction === 'below' ? '이하로 내려갈 때' : '이상으로 올라갈 때'}{' '}
              트리거가 발동됩니다.
            </p>
          </div>
        </fieldset>
      )}

      {/* ── Shared fields ─────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4">
        <legend className={sectionTitle}>공통 설정</legend>

        <div>
          <label htmlFor="cooldown_hours" className={labelBase}>
            쿨다운 (시간) <span className="text-danger">*</span>
          </label>
          <input
            id="cooldown_hours"
            type="number"
            inputMode="numeric"
            min={1}
            max={168}
            step={1}
            placeholder="예: 24"
            value={cooldownHours}
            onChange={(e) => setCooldownHours(e.target.value)}
            className={inputBase}
            aria-invalid={!!getFieldError('cooldown_hours')}
            aria-describedby={
              getFieldError('cooldown_hours') ? 'cooldown-error' : undefined
            }
          />
          {getFieldError('cooldown_hours') && (
            <p id="cooldown-error" className={errorBase} role="alert">
              {getFieldError('cooldown_hours')}
            </p>
          )}
          <p className="mt-1 text-xs text-ink-50">
            동일 트리거가 재발동되기까지 최소 대기 시간
          </p>
        </div>

        <div>
          <label htmlFor="trigger-label" className={labelBase}>
            레이블 (선택)
          </label>
          <input
            id="trigger-label"
            type="text"
            placeholder="예: 삼성전자 급락 알림"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            className={inputBase}
          />
          <p className="mt-1 text-xs text-ink-50">{label.length}/80</p>
        </div>
      </fieldset>

      {/* ── Submit error ─────────────────────────────────────────────────────── */}
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {submitError}
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 min-h-[52px] w-full"
        aria-busy={isLoading}
      >
        {isLoading ? '저장 중…' : '트리거 저장'}
      </button>
    </form>
  );
}
