import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import DeleteAccountButton from '../DeleteAccountButton';

describe('DeleteAccountButton (PIPA 제36조 UI)', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as typeof fetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('starts in idle stage with primary CTA', () => {
    render(<DeleteAccountButton />);
    expect(
      screen.getByRole('button', { name: '본인 데이터 즉시 삭제' }),
    ).toBeDefined();
  });

  it('enters confirm stage with warning copy on first click', () => {
    render(<DeleteAccountButton />);
    fireEvent.click(
      screen.getByRole('button', { name: '본인 데이터 즉시 삭제' }),
    );
    expect(screen.getByText(/되돌릴 수 없습니다/)).toBeDefined();
    expect(screen.getByRole('button', { name: '영구 삭제' })).toBeDefined();
    expect(screen.getByRole('button', { name: '취소' })).toBeDefined();
  });

  it('returns to idle on 취소', () => {
    render(<DeleteAccountButton />);
    fireEvent.click(
      screen.getByRole('button', { name: '본인 데이터 즉시 삭제' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(
      screen.getByRole('button', { name: '본인 데이터 즉시 삭제' }),
    ).toBeDefined();
  });

  it('surfaces error code on failed delete', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ code: 'P0001' }),
    });
    render(<DeleteAccountButton />);
    fireEvent.click(
      screen.getByRole('button', { name: '본인 데이터 즉시 삭제' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '영구 삭제' }));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('P0001');
    });
  });
});
