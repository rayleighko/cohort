import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';

const subscribeWebPushMock = vi.fn();
const unsubscribeWebPushMock = vi.fn();

vi.mock('@/lib/notification/sw-register', () => ({
  subscribeWebPush: (...args: unknown[]) => subscribeWebPushMock(...args),
  unsubscribeWebPush: (...args: unknown[]) => unsubscribeWebPushMock(...args),
}));

import { NotificationOptIn } from '../NotificationOptIn';

function setupNavigator(
  options: {
    serviceWorker?: 'missing' | 'no_registration' | 'with_subscription' | 'no_subscription';
  } = {},
) {
  const sw = options.serviceWorker ?? 'no_registration';
  if (sw === 'missing') {
    vi.stubGlobal('navigator', {});
    return;
  }
  const subscription = { endpoint: 'https://push.example.com/x' };
  const getRegistration = vi.fn(async () => {
    if (sw === 'no_registration') return null;
    return {
      pushManager: {
        getSubscription: vi.fn(async () =>
          sw === 'with_subscription' ? subscription : null,
        ),
      },
    };
  });
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration } });
}

function setupNotification(
  permission: NotificationPermission | 'missing' = 'default',
) {
  if (permission === 'missing') {
    delete (globalThis as Record<string, unknown>).Notification;
    return;
  }
  vi.stubGlobal('Notification', { permission, requestPermission: vi.fn() });
}

const VALID_SUB = {
  endpoint: 'https://push.example.com/abc',
  keys: { p256dh: 'p', auth: 'a' },
  expirationTime: null,
};

beforeEach(() => {
  subscribeWebPushMock.mockReset();
  unsubscribeWebPushMock.mockReset();
  setupNavigator();
  setupNotification('default');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('NotificationOptIn — initial mount', () => {
  it('status=error when serviceWorker not in navigator', async () => {
    setupNavigator({ serviceWorker: 'missing' });
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('browser_not_supported');
    });
  });

  it('status=denied when Notification.permission is already denied', async () => {
    setupNotification('denied');
    render(<NotificationOptIn />);
    await waitFor(() => {
      const btn = screen.getByRole('button');
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
    expect(screen.getByText(/브라우저 알림 권한이 차단/)).toBeDefined();
  });

  it('status=idle when registration exists but no subscription', async () => {
    setupNavigator({ serviceWorker: 'no_subscription' });
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
  });

  it('status=subscribed when existing subscription found', async () => {
    setupNavigator({ serviceWorker: 'with_subscription' });
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('해제');
    });
  });

  it('status=idle when no registration', async () => {
    setupNavigator({ serviceWorker: 'no_registration' });
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
  });
});

describe('NotificationOptIn — handleSubscribe', () => {
  it('subscribe success + POST success → status=subscribed, onStatusChange fired', async () => {
    subscribeWebPushMock.mockResolvedValue({ success: true, subscription: VALID_SUB });
    const onStatusChange = vi.fn();
    render(<NotificationOptIn onStatusChange={onStatusChange} />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('해제');
    });
    expect(onStatusChange).toHaveBeenCalledWith('subscribed');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/notification/subscribe',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('subscribeWebPush returns notification_permission_denied → status=denied', async () => {
    subscribeWebPushMock.mockResolvedValue({
      success: false,
      error: 'notification_permission_denied',
    });
    const onStatusChange = vi.fn();
    render(<NotificationOptIn onStatusChange={onStatusChange} />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    });
    expect(onStatusChange).toHaveBeenCalledWith('error', 'notification_permission_denied');
  });

  it('subscribeWebPush returns vapid_public_key_not_set → status=error', async () => {
    subscribeWebPushMock.mockResolvedValue({
      success: false,
      error: 'vapid_public_key_not_set',
    });
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('vapid_public_key_not_set');
    });
  });

  it('POST returns 401 → status=error with body.error', async () => {
    subscribeWebPushMock.mockResolvedValue({ success: true, subscription: VALID_SUB });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
      ),
    );
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('unauthorized');
    });
  });

  it('POST throws → status=error with thrown message', async () => {
    subscribeWebPushMock.mockResolvedValue({ success: true, subscription: VALID_SUB });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network_down');
      }),
    );
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('network_down');
    });
  });
});

describe('NotificationOptIn — handleUnsubscribe', () => {
  it('unsubscribe success → status=unsubscribed, onStatusChange fired', async () => {
    setupNavigator({ serviceWorker: 'with_subscription' });
    unsubscribeWebPushMock.mockResolvedValue({ success: true });
    const onStatusChange = vi.fn();
    render(<NotificationOptIn onStatusChange={onStatusChange} />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('해제');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('활성화');
    });
    expect(onStatusChange).toHaveBeenCalledWith('unsubscribed');
  });

  it('unsubscribe failure → status=error', async () => {
    setupNavigator({ serviceWorker: 'with_subscription' });
    unsubscribeWebPushMock.mockResolvedValue({
      success: false,
      error: 'unsubscribe_returned_false',
    });
    render(<NotificationOptIn />);
    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('해제');
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('unsubscribe_returned_false');
    });
  });
});

describe('NotificationOptIn — accessibility + copy', () => {
  it('button has 44px+ touch target via min-h-[44px] class', () => {
    render(<NotificationOptIn initialStatus="idle" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('min-h-[44px]');
  });

  it('renders Korean copy "푸시 알림" heading', () => {
    render(<NotificationOptIn initialStatus="idle" />);
    expect(screen.getByText('푸시 알림')).toBeDefined();
  });

  it('button aria-label reflects current state (활성화 when idle)', () => {
    render(<NotificationOptIn initialStatus="idle" />);
    expect(screen.getByLabelText('푸시 알림 활성화')).toBeDefined();
  });

  it('button aria-label reflects current state (해제 when subscribed)', () => {
    render(<NotificationOptIn initialStatus="subscribed" />);
    expect(screen.getByLabelText('푸시 알림 해제')).toBeDefined();
  });

  it('button is disabled while requesting', () => {
    render(<NotificationOptIn initialStatus="requesting" />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('button').textContent).toContain('처리 중');
  });
});
