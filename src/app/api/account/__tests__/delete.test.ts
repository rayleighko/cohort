import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase server + admin clients before importing the route handler.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { POST } from '@/app/api/account/delete/route';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const FAKE_USER = { id: 'user-uuid-1' };

function mockAuth(user: typeof FAKE_USER | null) {
  (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  });
}

function mockAdmin({
  profileError = null,
  authError = null,
}: { profileError?: unknown; authError?: unknown } = {}) {
  const deleteEq = vi.fn().mockResolvedValue({ error: profileError });
  const from = vi.fn().mockReturnValue({
    delete: vi.fn().mockReturnValue({ eq: deleteEq }),
  });
  const adminDeleteUser = vi.fn().mockResolvedValue({ error: authError });
  (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    from,
    auth: { admin: { deleteUser: adminDeleteUser } },
  });
  return { from, adminDeleteUser };
}

function makeRequest() {
  return new Request('http://localhost/api/account/delete', { method: 'POST' });
}

describe('POST /api/account/delete (PIPA 제36조)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers with 401', async () => {
    mockAuth(null);
    mockAdmin();
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it('cascade deletes user_profile then auth.users on happy path', async () => {
    mockAuth(FAKE_USER);
    const admin = mockAdmin();
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);
    expect(admin.from).toHaveBeenCalledWith('user_profile');
    expect(admin.adminDeleteUser).toHaveBeenCalledWith(FAKE_USER.id);
  });

  it('returns 500 + does not proceed to auth.users when user_profile delete fails', async () => {
    mockAuth(FAKE_USER);
    const admin = mockAdmin({
      profileError: { code: 'P0001', message: 'fk violation' },
    });
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(500);
    expect(admin.adminDeleteUser).not.toHaveBeenCalled();
  });

  it('returns 500 when auth.users delete fails after profile already gone', async () => {
    mockAuth(FAKE_USER);
    mockAdmin({ authError: { message: 'admin api fail' } });
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(500);
  });
});
