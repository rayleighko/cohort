// W4 Thu notification module — dispatcher skeleton
// Voice routing + body templating land in ST2; channel-specific providers in ST3-4;
// cron wiring + send execution in ST5. ST1 establishes the DB scaffolding path only.
// Refs: vault 62 §2 Q3 (4-category routing), vault 56 D9 (2-track channels)

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';
import { ProviderRegistry } from './providers/provider';
import type {
  ChannelTarget,
  DispatcherDispatchResult,
  NotificationCategory,
  NotificationChannel,
  NotificationPayload,
  VoicePersona,
} from './types';

type ShapeCTriggerRow = Database['public']['Tables']['shape_c_triggers']['Row'];
type BehavioralEventRow = Database['public']['Tables']['behavioral_event']['Row'];
type UserPreferenceRow =
  Database['public']['Tables']['user_notification_preference']['Row'];

export interface DispatchInput {
  user_id: string;
  trigger?: ShapeCTriggerRow | null;
  behavioral_event?: BehavioralEventRow | null;
  category: NotificationCategory;
  context_jsonb?: Record<string, unknown>;
}

const EMPTY_RESULT: DispatcherDispatchResult = {
  dispatched: [],
  succeeded: 0,
  failed: 0,
  notification_log_ids: [],
};

// Placeholder voice resolver — real Aurora/Vesper category mapping lands in ST2.
function resolveVoice(_category: NotificationCategory): VoicePersona {
  return 'aurora';
}

// Placeholder body generator — real templated copy lands in ST2.
function generateBody(_payload: Omit<NotificationPayload, 'body'>): string {
  return 'TODO ST2';
}

function resolveTargets(
  pref: UserPreferenceRow,
  registry: ProviderRegistry,
): ChannelTarget[] {
  const targets: ChannelTarget[] = [];
  const enabledChannels = new Set<NotificationChannel>(
    registry.listEnabled().map((p) => p.channel),
  );

  for (const raw of pref.channels) {
    const channel = raw as NotificationChannel;
    if (!enabledChannels.has(channel)) continue;

    if (channel === 'web_push') {
      const sub = pref.web_push_subscription as
        | { endpoint?: string }
        | null;
      if (sub?.endpoint) {
        targets.push({ channel, provider_token: sub.endpoint });
      }
    } else if (channel === 'kakao_alimtalk' && pref.kakao_user_id) {
      targets.push({ channel, provider_token: pref.kakao_user_id });
    }
  }
  return targets;
}

export async function dispatch(
  input: DispatchInput,
  registry: ProviderRegistry = new ProviderRegistry(),
): Promise<DispatcherDispatchResult> {
  const supabase = createAdminClient();

  const { data: pref, error: prefError } = await supabase
    .from('user_notification_preference')
    .select('*')
    .eq('user_id', input.user_id)
    .maybeSingle();

  if (prefError) {
    console.error('[notification/dispatcher] preference load failed', prefError);
    return EMPTY_RESULT;
  }
  if (!pref || pref.opt_out || pref.channels.length === 0) {
    return EMPTY_RESULT;
  }

  const targets = resolveTargets(pref, registry);
  if (targets.length === 0) return EMPTY_RESULT;

  const voice = resolveVoice(input.category);
  const partial: Omit<NotificationPayload, 'body'> = {
    user_id: input.user_id,
    category: input.category,
    voice,
    deep_link: undefined,
    trigger_id: input.trigger?.id ?? null,
    behavioral_event_id: input.behavioral_event?.id ?? null,
    metadata: input.context_jsonb ?? {},
    priority: 'normal',
  };
  const payload: NotificationPayload = {
    ...partial,
    body: generateBody(partial),
  };

  const logIds: string[] = [];
  for (const target of targets) {
    const { data, error } = await supabase
      .from('notification_log')
      .insert({
        user_id: payload.user_id,
        channel: target.channel,
        category: payload.category,
        voice: payload.voice,
        body: payload.body,
        status: 'pending',
        trigger_id: payload.trigger_id ?? null,
        behavioral_event_id: payload.behavioral_event_id ?? null,
        payload_jsonb: (payload.metadata ?? {}) as Database['public']['Tables']['notification_log']['Insert']['payload_jsonb'],
      })
      .select('id')
      .single();

    if (error) {
      console.error('[notification/dispatcher] log insert failed', error);
      continue;
    }
    if (data) logIds.push(data.id);
  }

  return {
    dispatched: targets,
    succeeded: 0,
    failed: 0,
    notification_log_ids: logIds,
  };
}
