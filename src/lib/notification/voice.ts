// W4 Thu notification module — voice resolver + Korean body template pool
// Refs: vault 38 §2.2 (Aurora 🕊 dovish), vault 38 §2.3 (Vesper 🦅 hawkish),
//       vault 62 §2 Q3 (4-category routing)
// Pure functions: no DB calls, no time calls outside the Math.random default in generateBody.

import type { NotificationCategory, VoicePersona } from './types';

export interface TemplateContext {
  score?: number;
  stance?: 'hawkish' | 'dovish' | 'neutral';
  trigger_label?: string;
  count?: number;
  plan_summary?: string;
}

export interface VoiceSelectionInput {
  category: NotificationCategory;
}

export interface BodyGenerationInput {
  category: NotificationCategory;
  voice: VoicePersona;
  ctx: TemplateContext;
  templateIndex?: number;
}

const TEMPLATES: Record<NotificationCategory, readonly string[]> = {
  trigger_alert: [
    'macro composite {{score}} — 본인 trigger 발동. Vesper가 봤습니다.',
    '{{trigger_label}} 조건 충족. 지금 확인 — Vesper 🦅',
    '한국 macro {{score}} {{stance}}. 본인이 설정한 trigger 발동.',
    'VIX/KRW/macro 조건 트리거. 본인 plan 점검 시점.',
    'Vesper 알람: {{trigger_label}} hit. App에서 detail 확인.',
  ],
  morning_brief: [
    '오늘의 cohort. 한국 macro {{score}} ({{stance}}). 본인 plan 그대로 가는 날 — Aurora 🕊',
    'Aurora 🕊 아침 점검: macro {{score}} {{stance}}. 본인 페이스 확인.',
    '오늘 macro composite {{score}}. 본인 plan 시작점 — Aurora 🕊',
  ],
  plan_reference: [
    '본인 plan: {{plan_summary}}. 페이스 그대로.',
    'Aurora 🕊 plan 확인: {{plan_summary}}. 적정 페이스.',
    '본인 cohort plan {{plan_summary}}. 동행합니다 — Aurora 🕊',
  ],
  behavioral_guard: [
    '최근 24h 본인 plan 위반 매도 {{count}}회. 잠시 호흡 — Aurora 🕊',
    'FOMO 신호 감지. 본인 plan 다시 보기 — Aurora가 함께합니다.',
    '본인 페이스 ≠ 시장 페이스. plan 그대로 — Aurora 🕊',
  ],
} as const;

export function selectVoice(input: VoiceSelectionInput): VoicePersona {
  switch (input.category) {
    case 'trigger_alert':
      return 'vesper';
    case 'morning_brief':
    case 'plan_reference':
    case 'behavioral_guard':
      return 'aurora';
    default: {
      const _exhaustive: never = input.category;
      throw new Error(`Unknown category: ${String(_exhaustive)}`);
    }
  }
}

function substituteVariables(template: string, ctx: TemplateContext): string {
  return template
    .replaceAll('{{score}}', ctx.score?.toFixed(1) ?? '')
    .replaceAll('{{stance}}', ctx.stance ?? '')
    .replaceAll('{{trigger_label}}', ctx.trigger_label ?? '')
    .replaceAll('{{count}}', ctx.count?.toString() ?? '')
    .replaceAll('{{plan_summary}}', ctx.plan_summary ?? '');
}

export function generateBody(input: BodyGenerationInput): string {
  const pool = TEMPLATES[input.category];
  const idx = input.templateIndex ?? Math.floor(Math.random() * pool.length);
  const safeIdx = ((idx % pool.length) + pool.length) % pool.length;
  const template = pool[safeIdx];
  const body = substituteVariables(template, input.ctx);

  const visibleLength = Array.from(body).length;
  if (visibleLength > 60) {
    console.warn(
      `[notification/voice] body exceeds 60 visible chars (got ${visibleLength}) — category=${input.category} idx=${safeIdx}`,
    );
  }
  return body;
}

export function templateCount(category: NotificationCategory): number {
  return TEMPLATES[category].length;
}
