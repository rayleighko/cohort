/**
 * Shape C — user's active trigger list.
 * TODO(W4): list trigger_config rows + active toggle + last-fired state.
 */
'use client';

/**
 * Shape C — TriggerList (W4 Tue)
 *
 * Displays active triggers with soft-delete and toggle active status.
 * V1 active: price_drop + macro_composite
 * V1.5 disabled: disclosure + composite
 *
 * Design: 44px+ touch targets, vault 40-42 token strict
 * Strategic constraint: Option B — NEVER timing/buy advice in labels
 * Vault refs: vault 62 §2, vault 56 D9
 */

import { useState, useEffect, useCallback } from 'react';
import type { ShapeCTrigger } from '@/types/trigger';

// ── Helper ────────────────────────────────────────────────────────────────────

function formatTriggerSummary(trigger: ShapeCTrigger): string {
  const { trigger_type, condition_params } = trigger;
  if (trigger_type === 'price_drop') {
    const p = condition_params as { ticker: string; threshold_pct: number; window_hours: number };
    return `${p.ticker} · ${p.threshold_pct}% 하락 / ${p.window_hours}h`;
  }
  if (trigger_type === 'macro_composite') {
    const p = condition_params as { direction: 'above' | 'below'; threshold: number };
    const dir = p.direction === 'below' ? '이하' : '이상';
    return `매크로 스코어 ${p.threshold} ${dir}`;
  }
  if (trigger_type === 'disclosure') {
    return '공시 알림 (V1.5)';
  }
  if (trigger_type === 'composite') {
    return '복합 조건 (V1.5)';
  }
  return trigger_type;
}

function formatLastFired(lastFiredAt: string | null): string {
  if (!lastFiredAt) return '미발동';
  const d = new Date(lastFiredAt);
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TriggerList() {
  const [triggers, setTriggers] = useState<ShapeCTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchTriggers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trigger');
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();
      setTriggers(Array.isArray(data) ? data : data.triggers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '트리거 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  // ── Toggle active ───────────────────────────────────────────────────────────

  async function handleToggle(trigger: ShapeCTrigger) {
    setPendingId(trigger.id);
    try {
      const res = await fetch(`/api/trigger/${trigger.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !trigger.is_active }),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      setTriggers((prev) =>
        prev.map((t) => (t.id === trigger.id ? { ...t, is_active: !t.is_active } : t)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  // ── Soft delete ─────────────────────────────────────────────────────────────

  async function handleDelete(triggerId: string) {
    setPendingId(triggerId);
    try {
      const res = await fetch(`/api/trigger/${triggerId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      setTriggers((prev) => prev.filter((t) => t.id !== triggerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '트리거 삭제에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  // ── Loading / empty / error states ──────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-ink-50" role="status">
        트리거 불러오는 중…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {error}
      </div>
    );
  }

  if (triggers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-ink-50">
        <span className="text-2xl" aria-hidden="true">
          🔔
        </span>
        <p>등록된 트리거가 없습니다.</p>
        <p className="text-xs">위 폼에서 첫 트리거를 추가해 보세요.</p>
      </div>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────────

  return (
    <ul className="flex flex-col gap-3" role="list" aria-label="등록된 트리거 목록">
      {triggers.map((trigger) => {
        const isPending = pendingId === trigger.id;
        return (
          <li
            key={trigger.id}
            className="rounded-xl border border-ink-10 bg-white px-4 py-4 shadow-sm"
          >
            {/* ── Header row ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                {/* Label */}
                {trigger.label && (
                  <p className="truncate text-sm font-semibold text-ink-90">{trigger.label}</p>
                )}
                {/* Summary */}
                <p className="truncate text-xs text-ink-50">{formatTriggerSummary(trigger)}</p>
              </div>

              {/* Active toggle */}
              <button
                type="button"
                onClick={() => handleToggle(trigger)}
                disabled={isPending}
                aria-pressed={trigger.is_active}
                aria-label={trigger.is_active ? '트리거 비활성화' : '트리거 활성화'}
                className={[
                  'flex-shrink-0 rounded-full border-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
                  trigger.is_active
                    ? 'border-primary bg-primary text-white'
                    : 'border-ink-20 bg-white text-ink-50',
                  isPending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80',
                ].join(' ')}
              >
                <span className="text-xs font-bold" aria-hidden="true">
                  {trigger.is_active ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* ── Meta row ───────────────────────────────────────────────────── */}
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-50">
              <span>쿨다운 {trigger.cooldown_hours}h · 마지막 발동 {formatLastFired(trigger.last_fired_at)}</span>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(trigger.id)}
                disabled={isPending}
                aria-label={`${trigger.label ?? formatTriggerSummary(trigger)} 트리거 삭제`}
                className={[
                  'rounded-lg border border-danger/30 px-3 py-1 text-xs text-danger transition-colors min-h-[36px]',
                  isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-danger/5 active:bg-danger/10',
                ].join(' ')}
              >
                삭제
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
