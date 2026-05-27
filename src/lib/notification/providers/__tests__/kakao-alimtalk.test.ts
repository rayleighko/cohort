import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KakaoAlimtalkProvider } from '../kakao-alimtalk';
import type { ChannelTarget, NotificationPayload } from '../../types';

const VALID_TARGET: ChannelTarget = {
  channel: 'kakao_alimtalk',
  provider_token: 'kakao-user-id',
};

const VALID_PAYLOAD: NotificationPayload = {
  user_id: 'user-1',
  category: 'trigger_alert',
  voice: 'vesper',
  body: 'body',
  priority: 'normal',
};

describe('KakaoAlimtalkProvider — enabled gate', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('is disabled when KAKAO_ALIMTALK_ENABLED is unset', () => {
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', '');
    vi.stubEnv('KAKAO_BIZ_API_KEY', 'k');
    vi.stubEnv('KAKAO_BIZ_CHANNEL_ID', 'c');
    expect(new KakaoAlimtalkProvider().enabled).toBe(false);
  });

  it('is disabled when KAKAO_ALIMTALK_ENABLED is not strictly "true"', () => {
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', '1');
    vi.stubEnv('KAKAO_BIZ_API_KEY', 'k');
    vi.stubEnv('KAKAO_BIZ_CHANNEL_ID', 'c');
    expect(new KakaoAlimtalkProvider().enabled).toBe(false);
  });

  it('is disabled when KAKAO_BIZ_API_KEY is missing', () => {
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', 'true');
    vi.stubEnv('KAKAO_BIZ_API_KEY', '');
    vi.stubEnv('KAKAO_BIZ_CHANNEL_ID', 'c');
    expect(new KakaoAlimtalkProvider().enabled).toBe(false);
  });

  it('is disabled when KAKAO_BIZ_CHANNEL_ID is missing', () => {
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', 'true');
    vi.stubEnv('KAKAO_BIZ_API_KEY', 'k');
    vi.stubEnv('KAKAO_BIZ_CHANNEL_ID', '');
    expect(new KakaoAlimtalkProvider().enabled).toBe(false);
  });

  it('is enabled when all three env vars are set', () => {
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', 'true');
    vi.stubEnv('KAKAO_BIZ_API_KEY', 'k');
    vi.stubEnv('KAKAO_BIZ_CHANNEL_ID', 'c');
    expect(new KakaoAlimtalkProvider().enabled).toBe(true);
  });
});

describe('KakaoAlimtalkProvider.send', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns kakao_alimtalk_disabled_v1 and warns when disabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', '');
    const provider = new KakaoAlimtalkProvider();
    const result = await provider.send(VALID_PAYLOAD, VALID_TARGET);
    expect(result.success).toBe(false);
    expect(result.error).toBe('kakao_alimtalk_disabled_v1');
    expect(result.retryable).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('returns kakao_alimtalk_not_implemented when enabled but stub body is in place', async () => {
    vi.stubEnv('KAKAO_ALIMTALK_ENABLED', 'true');
    vi.stubEnv('KAKAO_BIZ_API_KEY', 'k');
    vi.stubEnv('KAKAO_BIZ_CHANNEL_ID', 'c');
    const provider = new KakaoAlimtalkProvider();
    const result = await provider.send(VALID_PAYLOAD, VALID_TARGET);
    expect(result.success).toBe(false);
    expect(result.error).toBe('kakao_alimtalk_not_implemented');
    expect(result.retryable).toBe(false);
  });
});
