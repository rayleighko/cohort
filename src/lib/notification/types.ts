// W4 Thu notification module — core types
// Refs: vault 38 §2.2/2.3 (Aurora dovish / Vesper hawkish voice rules),
//       vault 62 §2 Q3 (4-category routing), vault 56 D9 (channels)

export type NotificationChannel = 'web_push' | 'kakao_alimtalk';

export type VoicePersona = 'aurora' | 'vesper';

export type NotificationCategory =
  | 'trigger_alert'
  | 'morning_brief'
  | 'plan_reference'
  | 'behavioral_guard';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationPayload {
  user_id: string;
  category: NotificationCategory;
  voice: VoicePersona;
  body: string;
  deep_link?: string;
  trigger_id?: string | null;
  behavioral_event_id?: string | null;
  metadata?: Record<string, unknown>;
  priority: NotificationPriority;
}

export interface ChannelTarget {
  channel: NotificationChannel;
  provider_token: string;
}

export interface ProviderSendResult {
  success: boolean;
  provider_message_id?: string;
  error?: string;
  retryable?: boolean;
}

export interface DispatcherDispatchResult {
  dispatched: ChannelTarget[];
  succeeded: number;
  failed: number;
  notification_log_ids: string[];
}
