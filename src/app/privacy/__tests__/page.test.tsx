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

  it('renders all operator (플랜사이) fields verbatim per vault 38 §1.4', () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/플랜사이/).length).toBeGreaterThan(0);
    expect(screen.getByText(/157-04-02001/)).toBeDefined();
    expect(screen.getByText(/2022-영등포-0450/)).toBeDefined();
    expect(screen.getAllByText(/조윤환/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/서울특별시 종로구 대학로 12길 61, 5층 501-87호/),
    ).toBeDefined();
    expect(screen.getAllByText(/010-4151-6626/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/contact@cohort\.co\.kr/).length).toBeGreaterThan(
      0,
    );
  });

  it('renders 개인정보 보호책임자 with name and contact', () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/개인정보 보호책임자/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/조윤환/).length).toBeGreaterThan(0);
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
