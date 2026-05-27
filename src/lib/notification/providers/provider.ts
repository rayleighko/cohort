// W4 Thu notification module — provider interface + registry
// Concrete providers (web-push, kakao-alimtalk) wire up in later sub-tasks.

import type {
  ChannelTarget,
  NotificationChannel,
  NotificationPayload,
  ProviderSendResult,
} from '../types';

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  readonly enabled: boolean;
  send(
    payload: NotificationPayload,
    target: ChannelTarget,
  ): Promise<ProviderSendResult>;
}

export class ProviderRegistry {
  private providers = new Map<NotificationChannel, NotificationProvider>();

  register(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  get(channel: NotificationChannel): NotificationProvider | null {
    return this.providers.get(channel) ?? null;
  }

  listEnabled(): NotificationProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.enabled);
  }
}
