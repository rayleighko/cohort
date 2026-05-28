import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

const signOutMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
}));

import SignOutButton from '../SignOutButton';

describe('SignOutButton', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    pushMock.mockReset();
    refreshMock.mockReset();
    signOutMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders idle 로그아웃 label', () => {
    render(<SignOutButton />);
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeDefined();
  });

  it('calls supabase signOut and redirects to landing on click', async () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading state while signing out', async () => {
    let resolveSignOut: ((value: { error: null }) => void) | undefined;
    signOutMock.mockReturnValueOnce(
      new Promise((res) => {
        resolveSignOut = res;
      }),
    );
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(
      screen.getByRole('button', { name: /로그아웃 중/ }),
    ).toBeDefined();
    resolveSignOut?.({ error: null });
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
  });
});
