/**
 * Template-based Aurora morning brief — $0 API, deterministic Option B copy.
 * Used when COHORT_NARRATION_LLM_ENABLED !== 'true'.
 */
import {
  keyDriverLabel,
  ZONE_LABEL_KO,
} from '@/lib/aurora/macro-labels';
import type { MacroComposite } from '@/lib/macro/composite';

const ZONE_PACE_HINT: Record<MacroComposite['zone'], string> = {
  dovish: '변동성이 상대적으로 낮은 구간으로 읽혀요. plan에 적어 둔 페이스를 유지해 보세요.',
  'neutral-dovish':
    '중립–비둘기 구간이에요. 급한 결정보다 plan·IPS 확인이 먼저예요.',
  neutral: '중립 구간이에요. 오늘도 본인 plan 기준으로 페이스를 맞춰 보세요.',
  'neutral-hawkish':
    '중립–매파 쪽이에요. trigger나 IPS에 적어 둔 규칙을 먼저 점검해 보세요.',
  hawkish:
    '변동성·긴장 신호가 있는 구간이에요. 평온할 때 정해 둔 plan으로 돌아가 보세요.',
};

export function buildMorningBriefTemplate(composite: MacroComposite): string {
  const zone = ZONE_LABEL_KO[composite.zone];
  const driver = keyDriverLabel(composite);
  const sign = composite.score >= 0 ? '+' : '';
  const hint = ZONE_PACE_HINT[composite.zone];
  const degraded =
    composite.degraded && (composite.missingIndicators?.length ?? 0) > 0
      ? ' 일부 지표가 빠져 있어요 — composite는 참고용으로만 보세요.'
      : '';

  return (
    `오늘 cohort. 한국 매크로 composite ${sign}${composite.score.toFixed(1)} (${zone}). ` +
    `핵심 driver는 ${driver}예요. ${hint}${degraded}`
  );
}
