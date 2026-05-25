import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  COHORT_PERSONA_MODEL,
  COHORT_PERSONA_MODEL_DEEP,
  COHORT_PERSONA_MODEL_FAST,
  shouldUseSonnet,
} from '@/lib/claude/client';
import type { UserInvestmentProfile } from '@/types/profile';

// Most assertions below exercise the V1.5 heuristic (vault 62 §2.1) — pin
// the env flag ON for the whole file, then per-test overrides as needed.
// The dedicated env-flag describe restores ORIGINAL after each case.
const ORIGINAL_ROUTING_FLAG = process.env.AURORA_MODEL_ROUTING_ENABLED;

beforeAll(() => {
  process.env.AURORA_MODEL_ROUTING_ENABLED = 'true';
});

afterAll(() => {
  if (ORIGINAL_ROUTING_FLAG === undefined) {
    delete process.env.AURORA_MODEL_ROUTING_ENABLED;
  } else {
    process.env.AURORA_MODEL_ROUTING_ENABLED = ORIGINAL_ROUTING_FLAG;
  }
});

describe('persona model constants (W3 Thu — dual-model routing)', () => {
  it('keeps COHORT_PERSONA_MODEL as the Sonnet alias for backward compat', () => {
    expect(COHORT_PERSONA_MODEL).toBe('claude-sonnet-4-6');
    expect(COHORT_PERSONA_MODEL_DEEP).toBe('claude-sonnet-4-6');
    expect(COHORT_PERSONA_MODEL_DEEP).toBe(COHORT_PERSONA_MODEL);
  });

  it('exposes COHORT_PERSONA_MODEL_FAST as Haiku 4.5 (per CLAUDE.md AI stack)', () => {
    expect(COHORT_PERSONA_MODEL_FAST).toBe('claude-haiku-4-5-20251001');
  });
});

describe('shouldUseSonnet — length signal', () => {
  it('returns false for short factual greeting', () => {
    expect(shouldUseSonnet('안녕하세요')).toBe(false);
    expect(shouldUseSonnet('네')).toBe(false);
    expect(shouldUseSonnet('감사합니다')).toBe(false);
  });

  it('returns true when message exceeds 200 chars (complex multi-clause)', () => {
    const long = '한'.repeat(201);
    expect(shouldUseSonnet(long)).toBe(true);
  });

  it('returns false at 200 chars boundary, true above', () => {
    expect(shouldUseSonnet('한'.repeat(200))).toBe(false);
    expect(shouldUseSonnet('한'.repeat(201))).toBe(true);
  });
});

describe('shouldUseSonnet — framework keyword signal', () => {
  it('routes to Sonnet on framework-affinity keyword (드러켄밀러)', () => {
    expect(shouldUseSonnet('드러켄밀러식 macro betting 영역 어때요?')).toBe(true);
  });

  it('routes to Sonnet on 김단테 / 버핏 / 달리오 / 코스톨라니 framework keyword', () => {
    expect(shouldUseSonnet('김단테식 한미 cross-border?')).toBe(true);
    expect(shouldUseSonnet('버핏식 인덱스 적립 영역 reference?')).toBe(true);
    expect(shouldUseSonnet('달리오식 all-weather 영역 위치?')).toBe(true);
    expect(shouldUseSonnet('코스톨라니식 cycle 분석 reference?')).toBe(true);
  });

  it('routes to Sonnet on English framework keyword (risk parity)', () => {
    expect(shouldUseSonnet('How does risk parity reference today?')).toBe(true);
  });
});

describe('shouldUseSonnet — macro deep-dive signal', () => {
  it('routes to Sonnet on 한미 금리차 / DXY / VIX', () => {
    expect(shouldUseSonnet('한미 금리차 어때요?')).toBe(true);
    expect(shouldUseSonnet('DXY 영역 어떻게 봐?')).toBe(true);
    expect(shouldUseSonnet('VIX 변동성 reference?')).toBe(true);
  });

  it('routes to Sonnet on FOMC / Fed / 한국은행 / 기준금리', () => {
    expect(shouldUseSonnet('FOMC 영역 어때요?')).toBe(true);
    expect(shouldUseSonnet('Fed dot plot 영역 reference?')).toBe(true);
    expect(shouldUseSonnet('한국은행 기준금리 영역?')).toBe(true);
  });
});

describe('shouldUseSonnet — behavioral / emotional signal', () => {
  it('routes to Sonnet on panic / FOMO English signal', () => {
    expect(shouldUseSonnet('panic sell 충동')).toBe(true);
    expect(shouldUseSonnet('FOMO 영역 어떡하죠')).toBe(true);
  });

  it('routes to Sonnet on Korean emotional signal', () => {
    expect(shouldUseSonnet('너무 무서워요')).toBe(true);
    expect(shouldUseSonnet('지금 손절해야 할까')).toBe(true);
    expect(shouldUseSonnet('존버 해야 할지 모르겠어')).toBe(true);
  });
});

describe('shouldUseSonnet — framework reasoning request', () => {
  it('routes to Sonnet on framework / reasoning / reference keyword', () => {
    expect(shouldUseSonnet('이걸 어떻게 봐야 하나')).toBe(true);
    expect(shouldUseSonnet('framework 영역 어디 위치?')).toBe(true);
    expect(shouldUseSonnet('어떻게 reasoning할까')).toBe(true);
  });
});

describe('shouldUseSonnet — profile-aware framework coach mode', () => {
  it('routes to Sonnet when profile has non-unsure framework_affinity', () => {
    const profile: Pick<UserInvestmentProfile, 'frameworkAffinity'> = {
      frameworkAffinity: ['drukenmiller_macro'],
    };
    expect(shouldUseSonnet('안녕', profile)).toBe(true);
  });

  it('stays on Haiku when profile.framework_affinity is empty', () => {
    const profile: Pick<UserInvestmentProfile, 'frameworkAffinity'> = {
      frameworkAffinity: [],
    };
    expect(shouldUseSonnet('안녕', profile)).toBe(false);
  });

  it('stays on Haiku when profile.framework_affinity is only [unsure]', () => {
    const profile: Pick<UserInvestmentProfile, 'frameworkAffinity'> = {
      frameworkAffinity: ['unsure'],
    };
    expect(shouldUseSonnet('안녕', profile)).toBe(false);
  });

  it('routes to Sonnet when mixed affinity contains any non-unsure entry', () => {
    const profile: Pick<UserInvestmentProfile, 'frameworkAffinity'> = {
      frameworkAffinity: ['unsure', 'buffett_index'],
    };
    expect(shouldUseSonnet('안녕', profile)).toBe(true);
  });

  it('accepts null/undefined profile gracefully (Tier 0 anonymous default)', () => {
    expect(shouldUseSonnet('안녕', null)).toBe(false);
    expect(shouldUseSonnet('안녕', undefined)).toBe(false);
    expect(shouldUseSonnet('안녕')).toBe(false);
  });
});

describe('shouldUseSonnet — Haiku-default path (short + factual)', () => {
  it('keeps short pleasantries / acknowledgments on Haiku', () => {
    expect(shouldUseSonnet('네 알겠어요')).toBe(false);
    expect(shouldUseSonnet('고마워요')).toBe(false);
    expect(shouldUseSonnet('나중에 또 볼게요')).toBe(false);
  });

  it('keeps short generic info requests on Haiku', () => {
    expect(shouldUseSonnet('지표 설명 부탁')).toBe(false);
    expect(shouldUseSonnet('오늘 날씨')).toBe(false);
  });

  it('routes ambiguous short queries to Haiku (cost-bias default)', () => {
    expect(shouldUseSonnet('어떻게')).toBe(false);
    expect(shouldUseSonnet('네')).toBe(false);
  });
});

describe('shouldUseSonnet — empty / edge inputs', () => {
  it('handles empty string', () => {
    expect(shouldUseSonnet('')).toBe(false);
  });

  it('handles whitespace-only', () => {
    expect(shouldUseSonnet('     ')).toBe(false);
  });
});

describe('shouldUseSonnet — env flag (vault 62 §2.1, CEO confirm 2026-05-25)', () => {
  // These cases override the file-level beforeAll (which pins the flag ON for
  // the V1.5 heuristic tests) to verify V1 runtime forcing.
  afterEach(() => {
    process.env.AURORA_MODEL_ROUTING_ENABLED = 'true';
  });

  it('returns true (Sonnet) when env flag is undefined — V1 default', () => {
    delete process.env.AURORA_MODEL_ROUTING_ENABLED;
    expect(shouldUseSonnet('짧은 질문')).toBe(true);
  });

  it('returns true (Sonnet) when env flag is "false"', () => {
    process.env.AURORA_MODEL_ROUTING_ENABLED = 'false';
    expect(shouldUseSonnet('짧은 질문')).toBe(true);
  });

  it('returns true (Sonnet) when env flag is empty string', () => {
    process.env.AURORA_MODEL_ROUTING_ENABLED = '';
    expect(shouldUseSonnet('짧은 질문')).toBe(true);
  });

  it('returns true (Sonnet) on case-mismatched "TRUE" — case-sensitive guard', () => {
    process.env.AURORA_MODEL_ROUTING_ENABLED = 'TRUE';
    expect(shouldUseSonnet('짧은 질문')).toBe(true);
  });

  it('falls back to heuristic when env flag is exactly "true"', () => {
    process.env.AURORA_MODEL_ROUTING_ENABLED = 'true';
    expect(shouldUseSonnet('짧은 질문')).toBe(false); // Haiku for short
    expect(shouldUseSonnet('드러켄밀러 macro 베팅 어떻게')).toBe(true); // framework
    expect(shouldUseSonnet('VIX reasoning 어떻게 봐')).toBe(true); // macro + reasoning
  });
});
