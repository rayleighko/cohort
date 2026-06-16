/**
 * Load authenticated user's IPS + Shape C triggers for companion context.
 * Gracefully empty when unauthenticated, migration not applied, or no rows.
 */
import { createClient } from '@/lib/supabase/server';
import {
  summarizeIpsDocument,
  type CompanionIpsSummary,
} from '@/lib/companion/ips-summary';
import type { TriggerTypeV1 } from '@/types/trigger';

export interface CompanionTriggerSummary {
  id: string;
  label: string;
  triggerType: TriggerTypeV1 | string;
  isActive: boolean;
}

export interface UserCompanionContext {
  userId: string | null;
  ips: CompanionIpsSummary;
  triggers: CompanionTriggerSummary[];
}

const TRIGGER_TYPE_LABEL: Record<string, string> = {
  price_drop: '가격 하락',
  macro_composite: '매크로 composite',
};

function triggerDisplayLabel(
  triggerType: string,
  label: string | null,
): string {
  if (label?.trim()) return label.trim();
  return TRIGGER_TYPE_LABEL[triggerType] ?? triggerType;
}

const EMPTY_IPS: CompanionIpsSummary = { hasIps: false };

export async function loadUserCompanionContext(): Promise<UserCompanionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, ips: EMPTY_IPS, triggers: [] };
  }

  const [ipsResult, triggersResult] = await Promise.all([
    supabase
      .from('investment_principle')
      .select('document, version')
      .eq('user_id', user.id)
      .is('superseded_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('shape_c_triggers')
      .select('id, trigger_type, label, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const ips =
    ipsResult.error || !ipsResult.data
      ? EMPTY_IPS
      : summarizeIpsDocument(
          ipsResult.data.document,
          ipsResult.data.version ?? undefined,
        );

  const triggers: CompanionTriggerSummary[] =
    triggersResult.error || !triggersResult.data
      ? []
      : triggersResult.data.map((row) => ({
          id: row.id,
          triggerType: row.trigger_type,
          label: triggerDisplayLabel(row.trigger_type, row.label),
          isActive: row.is_active,
        }));

  return { userId: user.id, ips, triggers };
}
