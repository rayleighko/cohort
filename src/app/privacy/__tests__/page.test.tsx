// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import PrivacyPage from '../page';

afterEach(() => {
  cleanup();
});

describe('PrivacyPage', () => {
  it('renders without crashing and shows the h1', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      '개인정보처리방침',
    );
  });

  it('renders the 시행일자 (effective date) string', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/2026-06-15/)).toBeDefined();
  });

  it('renders 개인 운영자 identity and contains no 플랜사이 company info (2026-06-11 개인 프로젝트 전환)', () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/개인 운영 서비스/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/gmj1197@gmail\.com/).length).toBeGreaterThan(0);
    // Regression guard — company info must never reappear
    expect(screen.queryByText(/플랜사이/)).toBeNull();
    expect(screen.queryByText(/157-04-02001/)).toBeNull();
    expect(screen.queryByText(/2022-영등포-0450/)).toBeNull();
    expect(screen.queryByText(/조윤환/)).toBeNull();
    expect(
      screen.queryByText(/서울특별시 종로구 대학로 12길 61, 5층 501-87호/),
    ).toBeNull();
    expect(screen.queryByText(/010-4151-6626/)).toBeNull();
    expect(screen.queryByText(/contact@cohort\.co\.kr/)).toBeNull();
  });

  it('renders 개인정보 보호책임자 with contact channel (PIPA 제31조)', () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/개인정보 보호책임자/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/gmj1197@gmail\.com/).length).toBeGreaterThan(0);
  });

  it('covers PIPA-mandated sections (purpose / retention / processors / rights)', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/제1조 \(개인정보의 처리 목적\)/)).toBeDefined();
    expect(
      screen.getByText(/제3조 \(개인정보의 처리 및 보유 기간\)/),
    ).toBeDefined();
    expect(screen.getByText(/제5조 \(개인정보 처리 업무의 위탁\)/)).toBeDefined();
    expect(
      screen.getByText(/제6조 \(정보주체의 권리·의무 및 그 행사방법\)/),
    ).toBeDefined();
  });

  it('lists entrusted processors (Supabase / Vercel / Anthropic / Toss)', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Supabase, Inc\. \(미국\)/)).toBeDefined();
    expect(screen.getByText(/Vercel, Inc\. \(미국\)/)).toBeDefined();
    expect(screen.getByText(/Anthropic, PBC \(미국\)/)).toBeDefined();
    expect(screen.getByText(/토스페이먼츠 주식회사 \(대한민국\)/)).toBeDefined();
  });
});
