/**
 * Rule-based Aurora pace companion copy — Option B safe, $0 API.
 * System-prompt *principles* encoded as deterministic templates.
 */
import { COHORT_FALLBACK_REDIRECT } from '@/lib/claude/safety-filter';
import {
  formatIndicatorLabel,
  keyDriverLabel,
  ZONE_LABEL_KO,
} from '@/lib/aurora/macro-labels';
import type { MacroComposite } from '@/lib/macro/composite';
import type { CompanionIntent } from '@/lib/companion/intent-router';
import type { CompanionIpsSummary } from '@/lib/companion/ips-summary';
import type { CompanionTriggerSummary } from '@/lib/companion/load-user-context';

export interface CompanionContext {
  composite?: MacroComposite;
  ips?: CompanionIpsSummary;
  triggers?: CompanionTriggerSummary[];
}

function ipsPlanLine(ips: CompanionIpsSummary | undefined): string | null {
  if (!ips?.hasIps) return null;
  const parts: string[] = [];
  if (ips.horizonLabel) parts.push(`투자 기간 ${ips.horizonLabel}`);
  if (ips.allocationLine) parts.push(`목표 배분 ${ips.allocationLine}`);
  if (ips.drawdownReviewPct != null) {
    parts.push(`손실 ${ips.drawdownReviewPct}% 도달 시 plan 검토`);
  }
  return parts.length > 0 ? `저장된 IPS: ${parts.join(' · ')}.` : null;
}

function triggerListLine(triggers: CompanionTriggerSummary[] | undefined): string | null {
  const active = triggers?.filter((t) => t.isActive) ?? [];
  if (active.length === 0) return null;
  const names = active.slice(0, 3).map((t) => t.label).join(', ');
  const extra = active.length > 3 ? ` 외 ${active.length - 3}개` : '';
  return `등록된 Shape C trigger ${active.length}개 (${names}${extra}).`;
}

function preCommitmentLine(ips: CompanionIpsSummary | undefined): string | null {
  if (!ips?.preCommitmentExcerpt) return null;
  return `IPS에 적어 둔 한 문장: 「${ips.preCommitmentExcerpt}」`;
}

function appendContext(base: string, ctx: CompanionContext): string {
  const extras = [
    ipsPlanLine(ctx.ips),
    triggerListLine(ctx.triggers),
  ].filter(Boolean) as string[];
  if (extras.length === 0) return base;
  return `${base} ${extras.join(' ')}`;
}

function macroBlock(composite: MacroComposite): string {
  const zone = ZONE_LABEL_KO[composite.zone];
  const driver = keyDriverLabel(composite);
  const sign = composite.score >= 0 ? '+' : '';
  return (
    `오늘 cohort 매크로 composite ${sign}${composite.score.toFixed(1)} (${zone}). ` +
    `핵심 driver는 ${driver}예요.`
  );
}

const INTENT_COPY: Record<
  Exclude<CompanionIntent, 'advisory_redirect' | 'macro_today'>,
  (ctx: CompanionContext) => string
> = {
  plan_reminder: (ctx) =>
    appendContext(
      '평온할 때 정해 둔 본인 plan이, 흔들릴 때 돌아갈 자리예요. ' +
        '설정 → 투자 원칙(IPS)에서 목표 배분·손실 한도·페이스를 다시 확인해 보세요. ' +
        '코호트는 매수·매도나 비중을 제안하지 않고, 본인이 쓴 원칙만 정리해 드려요.',
      ctx,
    ),

  split_buy_pace: (ctx) =>
    appendContext(
      '분할매수·적립 페이스는 plan에 적어 둔 주기를 우선해요. ' +
        '감정이 올라온 날에는 새 매매보다 plan과 IPS를 먼저 여는 편이 좋아요. ' +
        'Shape B에서 본인 페이스 메모를 확인하거나, IPS에 적어 둔 규칙을 따라가 보세요.',
      ctx,
    ),

  trigger_guide: (ctx) => {
    const base =
      'Shape C trigger는 본인이 정한 조건에 도달하면 Aurora/Vesper가 알림으로 상기시켜 드려요. ' +
      '자동 매매는 없고, plan 검토 타이밍을 알려 주는 도구예요. ' +
      '설정 → 알림에서 push를 켜 두면 trigger 발동 시 받을 수 있어요.';
    const line = triggerListLine(ctx.triggers);
    return line ? `${base} ${line}` : appendContext(base, ctx);
  },

  behavioral_calm: (ctx) => {
    const pre = preCommitmentLine(ctx.ips);
    const base =
      '지금 마음이 급해질 수 있는 구간이에요. 24시간 유예 규칙 — plan과 IPS만 확인하고, ' +
      '충동적 일괄 매매는 미루는 편이 research에서 자주 쓰이는 패턴이에요. ' +
      (pre ?? '본인이 IPS에 적어 둔 한 문장을 다시 읽어 보세요.');
    return appendContext(base, ctx);
  },

  ips_guide: () =>
    '투자 원칙(IPS)은 평온할 때 본인 plan을 문서로 남기는 단계예요. ' +
    '설정 → 「투자 원칙 (IPS) 작성」에서 6단계로 목표·배분·손실 한도·페이스를 정리할 수 있어요.',

  service_info: () =>
    'Cohort(코호트)는 본인 plan과 페이스를 지키도록 돕는 pace companion이에요. ' +
    '매크로 대시보드, 분할매수 페이스(Shape B), trigger 알림(Shape C), IPS 위저드가 핵심이에요. ' +
    '정보 + 도구 + 의사결정 지원만 제공하며, 투자 자문이 아닙니다.',

  general_fallback: (ctx) => {
    const base =
      '아래 버튼으로 자주 쓰는 주제를 골라 보세요. ' +
      '매크로·plan·분할매수·trigger·IPS 관련 질문이면 키워드를 포함해 다시 적어 주셔도 돼요.';
    if (ctx.composite) {
      return `${macroBlock(ctx.composite)} ${base}`;
    }
    return base;
  },
};

export function buildCompanionResponse(
  intent: CompanionIntent,
  ctx: CompanionContext,
): string {
  if (intent === 'advisory_redirect') {
    return COHORT_FALLBACK_REDIRECT;
  }
  if (intent === 'macro_today') {
    if (!ctx.composite) {
      return (
        '매크로 composite는 대시보드에서 확인할 수 있어요. ' +
        '데이터가 로드되면 오늘 zone과 driver를 여기서도 요약해 드릴게요.'
      );
    }
    const degraded =
      ctx.composite.degraded && (ctx.composite.missingIndicators?.length ?? 0) > 0
        ? ' 일부 지표가 빠져 degraded 상태예요 — plan 기준을 우선해 보세요.'
        : '';
    const top = ctx.composite.indicators
      .slice(0, 2)
      .map((i) => formatIndicatorLabel(i.code, i.latest))
      .join(', ');
    return (
      `${macroBlock(ctx.composite)} ${top ? `참고: ${top}.` : ''}` +
      ' composite는 신호가 아니라 정보예요 — 본인 plan 페이스를 우선해 보세요.' +
      degraded
    );
  }
  return INTENT_COPY[intent](ctx);
}
