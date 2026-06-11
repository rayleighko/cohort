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
}

export function GlRtsQuestionStep({
  question,
  value,
  onChange,
}: GlRtsQuestionStepProps) {
  const [showRationale, setShowRationale] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-cohort-ink-50">
          위험감수성 진단 {question.number}/13
        </p>
        <p className="mt-2 break-keep text-base font-semibold text-cohort-ink-90">
          {question.prompt}
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as GlRtsOptionId)}
        aria-label={`GL-RTS ${question.number}번 문항`}
      >
        {question.options.map((opt) => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors motion-reduce:transition-none',
                selected
                  ? 'border-cohort-primary bg-cohort-primary/5'
                  : 'border-cohort-ink-10 bg-white',
              )}
            >
              <RadioGroupItem value={opt.id} id={`${question.id}-${opt.id}`} />
              <Label
                htmlFor={`${question.id}-${opt.id}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {opt.label}
              </Label>
            </label>
          );
        })}
      </RadioGroup>

      <button
        type="button"
        onClick={() => setShowRationale((s) => !s)}
        className="flex min-h-[44px] items-center gap-1 text-xs text-cohort-ink-50 hover:text-cohort-primary"
        aria-expanded={showRationale}
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform motion-reduce:transition-none',
            showRationale && 'rotate-180',
          )}
        />
        근거 보기
      </button>

      {showRationale && (
        <div
          className="rounded-xl bg-cohort-ink-05 px-4 py-3 text-xs leading-relaxed text-cohort-ink-70"
          role="note"
        >
          <p className="break-keep">{question.rationale}</p>
          <p className="mt-2 text-cohort-ink-50">{question.source}</p>
          <p className="mt-2 break-keep text-cohort-ink-50">
            Grable-Lytton(1999) 척도의 한국어 번안이며, 번안판 자체의 심리측정
            타당화는 거치지 않았습니다.
          </p>
        </div>
      )}
    </div>
  );
}
