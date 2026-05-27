// W4 Thu notification module — dispatcher
// Channel-specific providers wire up in ST3-4; cron + send execution in ST5.
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
} from './types';
import { generateBody, selectVoice, type TemplateContext } from './voice';

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

const VALID_STANCES = new Set(['hawkish', 'dovish', 'neutral']);

function deriveTemplateContext(input: DispatchInput): TemplateContext {
  const ctx = input.context_jsonb ?? {};
  const stanceRaw = ctx.stance;
  return {
    score: typeof ctx.macro_composite_score === 'number'
      ? ctx.macro_composite_score
      : undefined,
    stance: typeof stanceRaw === 'string' && VALID_STANCES.has(stanceRaw)
      ? (stanceRaw as 'hawkish' | 'dovish' | 'neutral')
      : undefined,
    trigger_label: input.trigger?.label ?? undefined,
    count: typeof ctx.count === 'number' ? ctx.count : undefined,
    plan_summary: typeof ctx.plan_summary === 'string'
      ? ctx.plan_summary
      : undefined,
  };
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

  const voice = selectVoice({ category: input.category });
  const ctx = deriveTemplateContext(input);
  const body = generateBody({ category: input.category, voice, ctx });
  const payload: NotificationPayload = {
    user_id: input.user_id,
    category: input.category,
    voice,
    body,
    deep_link: undefined,
    trigger_id: input.trigger?.id ?? null,
    behavioral_event_id: input.behavioral_event?.id ?? null,
    metadata: input.context_jsonb ?? {},
    priority: 'normal',
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
