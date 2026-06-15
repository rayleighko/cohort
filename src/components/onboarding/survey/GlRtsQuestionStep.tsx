'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { GlRtsOptionId, GlRtsQuestion } from '@/lib/profile/gl-rts-questions';
import { cn } from '@/lib/utils';

interface GlRtsQuestionStepProps {
  question: GlRtsQuestion;
  value: GlRtsOptionId | '';
  onChange: (value: GlRtsOptionId) => void;
  onRationaleToggle?: (expanded: boolean) => void;
  /** Hide duplicate sub-label when SurveyModal header shows step progress */
  showSubLabel?: boolean;
}

export function GlRtsQuestionStep({
  question,
  value,
  onChange,
  onRationaleToggle,
  showSubLabel = false,
}: GlRtsQuestionStepProps) {
  const [showRationale, setShowRationale] = useState(false);

  const toggleRationale = () => {
    setShowRationale((prev) => {
      const next = !prev;
      onRationaleToggle?.(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        {showSubLabel ? (
          <p className="text-xs font-medium uppercase tracking-wide text-cohort-ink-50">
            위험감수성 진단 {question.number}/13
          </p>
        ) : null}
        <p
          className={cn(
            'break-keep text-sm font-semibold leading-snug text-cohort-ink-90 sm:text-base',
            showSubLabel && 'mt-2',
          )}
        >
          {question.prompt}
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as GlRtsOptionId)}
        aria-label={`위험감수성 ${question.number}번 문항`}
        className="gap-2"
      >
        {question.options.map((opt) => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                'flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm leading-snug transition-colors motion-reduce:transition-none',
                selected
                  ? 'border-cohort-primary bg-cohort-primary/5'
                  : 'border-cohort-ink-10 bg-white',
              )}
            >
              <RadioGroupItem value={opt.id} id={`${question.id}-${opt.id}`} />
              <Label
                htmlFor={`${question.id}-${opt.id}`}
                className="flex-1 cursor-pointer font-normal leading-snug"
              >
                {opt.label}
              </Label>
            </label>
          );
        })}
      </RadioGroup>

      <button
        type="button"
        onClick={toggleRationale}
        className="flex min-h-[36px] items-center gap-1 text-xs text-cohort-ink-50 hover:text-cohort-primary"
        aria-expanded={showRationale}
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none',
            showRationale && 'rotate-180',
          )}
        />
        근거 보기
      </button>

      {showRationale && (
        <div
          className="rounded-lg bg-cohort-ink-05 px-3 py-2.5 text-xs leading-relaxed text-cohort-ink-70"
          role="note"
        >
          <p className="break-keep">{question.rationale}</p>
          <p className="mt-1.5 text-cohort-ink-50">{question.source}</p>
          <p className="mt-1.5 break-keep text-cohort-ink-50">
            그레이블·리턴(1999) 위험감수성 척도의 한국어 번안이며, 번안판 자체의
            심리측정 타당화는 거치지 않았습니다.
          </p>
        </div>
      )}
    </div>
  );
}
