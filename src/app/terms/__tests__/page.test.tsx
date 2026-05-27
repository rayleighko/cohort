// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import TermsPage from '../page';

afterEach(() => {
  cleanup();
});

describe('TermsPage', () => {
  it('renders without crashing and shows the h1', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      '이용약관',
    );
  });

  it('renders the 시행일자 (effective date) string', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/2026-06-15/).length).toBeGreaterThan(0);
  });

  it('keeps the Strategic Decision 0 Option B disclaimer present', () => {
    // Compliance clause must be in the DOM so future copy edits cannot
    // silently drop it. Refs vault 38 §1.2 + vault 27 §6.1.
    render(<TermsPage />);
    expect(screen.getByText(/자본시장법 정합/)).toBeDefined();
    expect(screen.getByText(/정보 제공 \+ 도구 \+ 의사결정 지원/)).toBeDefined();
    expect(screen.getByText(/투자자문업 또는 투자일임업이 아닙니다/)).toBeDefined();
    expect(screen.getByText(/모든 투자 결정과 그 결과는 이용자 본인의 책임/),
    ).toBeDefined();
  });

  it('enumerates the "회사가 제공하지 않는 영역" (no-recommendation) clauses', () => {
    render(<TermsPage />);
    expect(screen.getByText(/개별 종목 매수\/매도 추천/)).toBeDefined();
    expect(screen.getByText(/구체적 비중 권장/)).toBeDefined();
    expect(screen.getByText(/timing 추천/)).toBeDefined();
  });

  it('names Toss Payments KRW as the payment processor', () => {
    render(<TermsPage />);
    expect(screen.getByText(/토스페이먼츠\(Toss Payments\)/)).toBeDefined();
  });

  it('sets 서울중앙지방법원 as the 1st-instance jurisdiction', () => {
    render(<TermsPage />);
    expect(screen.getByText(/서울중앙지방법원/)).toBeDefined();
  });

  it('renders all operator (플랜사이) fields verbatim per vault 38 §1.4', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/플랜사이/).length).toBeGreaterThan(0);
    expect(screen.getByText(/157-04-02001/)).toBeDefined();
    expect(screen.getByText(/2022-영등포-0450/)).toBeDefined();
    expect(screen.getAllByText(/조윤환/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/서울특별시 종로구 대학로 12길 61, 5층 501-87호/),
    ).toBeDefined();
    expect(screen.getByText(/010-4151-6626/)).toBeDefined();
    expect(screen.getByText(/contact@cohort\.co\.kr/)).toBeDefined();
  });
});
