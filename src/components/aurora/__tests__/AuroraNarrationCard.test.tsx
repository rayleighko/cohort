import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import type { MacroComposite } from '@/lib/macro/composite';
import type { LatestNarration } from '@/lib/aurora/get-latest-narration';

// Mock useSWR so we can drive isLoading / data deterministically without
// running real fetch + revalidation timers in tests.
const swrMock = vi.fn();
vi.mock('swr', () => ({
  default: (...args: unknown[]) => swrMock(...args),
}));

import { AuroraNarrationBody } from '../AuroraNarrationCard';

const SAMPLE_COMPOSITE: MacroComposite = {
  score: 2.34,
  zone: 'neutral-dovish',
  keyDriver: { source: 'fred', code: 'KR_US_RATE_SPREAD', contribution: 1.42 },
  indicators: [],
  computedAt: '2026-05-27T01:00:00.000Z',
  asOfDate: '2026-05-27',
};

const SAMPLE_ARCHIVE: LatestNarration = {
  text: '어제의 cohort. 한국 macro composite는 +2.1 (neutral-dovish).',
  category: 'morning_brief',
  zone: 'neutral-dovish',
  createdAt: '2026-05-26T01:00:00.000Z',
  isArchive: true,
};

const ARCHIVE_ANNOTATION =
  '오늘의 cohort — 어제 morning brief 표시 중 · 새 brief 준비 중…';

beforeEach(() => {
  swrMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('AuroraNarrationBody — D25 archive fallback', () => {
  it('renders skeleton when no archive is provided and SWR is loading', () => {
    swrMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });
    render(<AuroraNarrationBody composite={SAMPLE_COMPOSITE} />);
    expect(
      screen.getByLabelText('Aurora morning brief 생성 중'),
    ).toBeDefined();
    expect(screen.queryByText(ARCHIVE_ANNOTATION)).toBeNull();
  });

  it('renders archive text immediately (no skeleton) when initialArchive is provided', () => {
    // SWR seeded with fallbackData returns data = archive while still loading.
    swrMock.mockReturnValue({
      data: {
        character: 'aurora',
        text: SAMPLE_ARCHIVE.text,
        triggered: false,
        zone: SAMPLE_ARCHIVE.zone,
      },
      error: undefined,
      isLoading: true,
    });
    render(
      <AuroraNarrationBody
        composite={SAMPLE_COMPOSITE}
        initialArchive={SAMPLE_ARCHIVE}
      />,
    );
    expect(screen.getByText(SAMPLE_ARCHIVE.text)).toBeDefined();
    expect(screen.queryByLabelText('Aurora morning brief 생성 중')).toBeNull();
  });

  it('renders the verbatim timestamp annotation while showing the archive', () => {
    swrMock.mockReturnValue({
      data: {
        character: 'aurora',
        text: SAMPLE_ARCHIVE.text,
        triggered: false,
        zone: SAMPLE_ARCHIVE.zone,
      },
      error: undefined,
      isLoading: true,
    });
    render(
      <AuroraNarrationBody
        composite={SAMPLE_COMPOSITE}
        initialArchive={SAMPLE_ARCHIVE}
      />,
    );
    // CEO Q2 mitigation — exact verbatim Korean copy must be present.
    expect(screen.getByText(ARCHIVE_ANNOTATION)).toBeDefined();
    expect(screen.getByTestId('aurora-archive-annotation')).toBeDefined();
  });

  it('hides the annotation once a fresh narration arrives that differs from the archive', () => {
    swrMock.mockReturnValue({
      data: {
        character: 'aurora',
        text: '오늘의 cohort. 새로 생성된 morning brief.',
        triggered: false,
        zone: 'neutral-dovish',
      },
      error: undefined,
      isLoading: false,
    });
    render(
      <AuroraNarrationBody
        composite={SAMPLE_COMPOSITE}
        initialArchive={SAMPLE_ARCHIVE}
      />,
    );
    expect(
      screen.getByText('오늘의 cohort. 새로 생성된 morning brief.'),
    ).toBeDefined();
    expect(screen.queryByText(ARCHIVE_ANNOTATION)).toBeNull();
    expect(screen.queryByTestId('aurora-archive-annotation')).toBeNull();
  });

  it('hides the annotation when the fresh fetch resolves with the same text as the archive', () => {
    // Edge case: live re-fetch returned the exact same narration. Once
    // isLoading flips false the annotation must come off (user no longer
    // staring at stale-marked text while a fresh request is in flight).
    swrMock.mockReturnValue({
      data: {
        character: 'aurora',
        text: SAMPLE_ARCHIVE.text,
        triggered: false,
        zone: SAMPLE_ARCHIVE.zone,
      },
      error: undefined,
      isLoading: false,
    });
    render(
      <AuroraNarrationBody
        composite={SAMPLE_COMPOSITE}
        initialArchive={SAMPLE_ARCHIVE}
      />,
    );
    expect(screen.getByText(SAMPLE_ARCHIVE.text)).toBeDefined();
    expect(screen.queryByText(ARCHIVE_ANNOTATION)).toBeNull();
  });

  it('renders the Korean error fallback when SWR errors and no data is available', () => {
    swrMock.mockReturnValue({
      data: undefined,
      error: Object.assign(new Error('narration_http_503'), {
        serverText: '[Aurora가 잠시 후 다시 인사드릴게요]',
      }),
      isLoading: false,
    });
    render(<AuroraNarrationBody composite={SAMPLE_COMPOSITE} />);
    expect(
      screen.getByText('[Aurora가 잠시 후 다시 인사드릴게요]'),
    ).toBeDefined();
  });

  it('seeds SWR with fallbackData when initialArchive is provided', () => {
    swrMock.mockReturnValue({
      data: {
        character: 'aurora',
        text: SAMPLE_ARCHIVE.text,
        triggered: false,
        zone: SAMPLE_ARCHIVE.zone,
      },
      error: undefined,
      isLoading: true,
    });
    render(
      <AuroraNarrationBody
        composite={SAMPLE_COMPOSITE}
        initialArchive={SAMPLE_ARCHIVE}
      />,
    );
    expect(swrMock).toHaveBeenCalledOnce();
    const swrConfig = swrMock.mock.calls[0]?.[2] as {
      fallbackData?: { text: string };
      revalidateOnMount?: boolean;
    };
    expect(swrConfig.fallbackData?.text).toBe(SAMPLE_ARCHIVE.text);
    expect(swrConfig.revalidateOnMount).toBe(true);
  });

  it('omits fallbackData and revalidateOnMount when initialArchive is null', () => {
    swrMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });
    render(
      <AuroraNarrationBody composite={SAMPLE_COMPOSITE} initialArchive={null} />,
    );
    const swrConfig = swrMock.mock.calls[0]?.[2] as {
      fallbackData?: unknown;
      revalidateOnMount?: boolean;
    };
    expect(swrConfig.fallbackData).toBeUndefined();
    expect(swrConfig.revalidateOnMount).toBe(false);
  });
});
