/**
 * Active IPS load + save — V2-004 investment_principle table.
 */
import type { IpsDocument } from '@/domains/principle/domain/ips-schema';
import { safeParseIpsDocument } from '@/domains/principle/domain/ips-schema';
import type { Json } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface ActiveIpsRow {
  id: string;
  version: number;
  document: IpsDocument;
  acknowledged_at: string;
  created_at: string;
}

export interface SaveIpsResult {
  id: string;
  version: number;
  acknowledged_at: string;
  created_at: string;
}

type Db = SupabaseClient<Database>;

export async function loadActiveIps(
  supabase: Db,
  userId: string,
): Promise<ActiveIpsRow | null> {
  const { data, error } = await supabase
    .from('investment_principle')
    .select('id, version, document, acknowledged_at, created_at')
    .eq('user_id', userId)
    .is('superseded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = safeParseIpsDocument(data.document);
  if (!parsed.success) return null;

  return {
    id: data.id,
    version: data.version,
    document: parsed.data,
    acknowledged_at: data.acknowledged_at,
    created_at: data.created_at,
  };
}

export async function saveActiveIps(
  supabase: Db,
  userId: string,
  document: IpsDocument,
): Promise<SaveIpsResult> {
  const { data: active } = await supabase
    .from('investment_principle')
    .select('id, version')
    .eq('user_id', userId)
    .is('superseded_at', null)
    .maybeSingle();

  const now = new Date().toISOString();
  const nextVersion = active ? active.version + 1 : 1;

  if (active) {
    const { error: supersedeError } = await supabase
      .from('investment_principle')
      .update({ superseded_at: now })
      .eq('id', active.id)
      .eq('user_id', userId);

    if (supersedeError) {
      throw new Error(`supersede_failed:${supersedeError.message}`);
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('investment_principle')
    .insert({
      user_id: userId,
      version: nextVersion,
      document: document as unknown as Json,
      acknowledged_at: now,
    })
    .select('id, version, acknowledged_at, created_at')
    .single();

  if (insertError || !inserted) {
    throw new Error(`insert_failed:${insertError?.message ?? 'unknown'}`);
  }

  await supabase
    .from('user_investment_profile')
    .update({ linked_principle_id: inserted.id })
    .eq('user_id', userId);

  return inserted;
}
