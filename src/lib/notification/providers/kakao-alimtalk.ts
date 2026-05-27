/**
 * KakaoAlimtalkProvider — V1 STUB (disabled by default).
 *
 * 사업자 verify 반려 (2026-05-27) → 비즈 카카오 채널 개설 불가 → V1 launch에서는 NO-OP.
 *
 * V1.1+ activation prerequisites:
 *   1. 사업자 verify 통과 OR 법인 설립 + 사업자등록 (별도 트랙)
 *   2. 비즈 카카오 채널 개설 + 알림톡 템플릿 승인 (5-7일 lead)
 *   3. .env.local에 KAKAO_ALIMTALK_ENABLED=true + KAKAO_BIZ_API_KEY + KAKAO_BIZ_CHANNEL_ID
 *      + KAKAO_BIZ_TEMPLATE_ID_<CATEGORY> set
 *   4. send() body 안 actual HTTP call 활성화 (V1.1 separate commit)
 *
 * Refs: vault 56 D9 (V1 scope), vault 62 §2 (notification surface plan)
 */

import type {
  ChannelTarget,
  NotificationChannel,
  NotificationPayload,
  ProviderSendResult,
} from '../types';
import type { NotificationProvider } from './provider';

export class KakaoAlimtalkProvider implements NotificationProvider {
  readonly channel: NotificationChannel = 'kakao_alimtalk';

  get enabled(): boolean {
    return (
      process.env.KAKAO_ALIMTALK_ENABLED === 'true' &&
      Boolean(process.env.KAKAO_BIZ_API_KEY) &&
      Boolean(process.env.KAKAO_BIZ_CHANNEL_ID)
    );
  }

  async send(
    payload: NotificationPayload,
    _target: ChannelTarget,
  ): Promise<ProviderSendResult> {
    if (!this.enabled) {
      console.warn(
        '[KakaoAlimtalkProvider] disabled — V1 stub (사업자 verify pending). ' +
          `user=${payload.user_id} category=${payload.category}`,
      );
      return {
        success: false,
        error: 'kakao_alimtalk_disabled_v1',
        retryable: false,
      };
    }

    // V1.1+ activation: implement real Kakao Biz Alimtalk API call here.
    //
    // Expected request structure (V1.1+):
    //   POST {KAKAO_BIZ_API_ENDPOINT}/v1/alimtalk/send
    //   Headers:
    //     Authorization: Bearer {KAKAO_BIZ_API_KEY}
    //     Content-Type: application/json
    //   Body: {
    //     channel_id: KAKAO_BIZ_CHANNEL_ID,
    //     template_id: <category-mapped template ID>,
    //     recipient: target.provider_token (kakao_user_id),
    //     variables: { ... derived from payload },
    //   }
    //
    // Category → template_id env mapping (V1.1+):
    //   - trigger_alert → KAKAO_BIZ_TEMPLATE_ID_TRIGGER_ALERT
    //   - morning_brief → KAKAO_BIZ_TEMPLATE_ID_MORNING_BRIEF
    //   - plan_reference → KAKAO_BIZ_TEMPLATE_ID_PLAN_REFERENCE
    //   - behavioral_guard → KAKAO_BIZ_TEMPLATE_ID_BEHAVIORAL_GUARD

    return {
      success: false,
      error: 'kakao_alimtalk_not_implemented',
      retryable: false,
    };
  }
}
