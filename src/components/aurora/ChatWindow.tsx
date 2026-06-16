'use client';

/**
 * Aurora 🕊 pace companion window — chat-like UI, rule-based responses ($0 LLM).
 *
 * Default: POST /api/companion/turn (intent router + templates).
 * Optional AI Beta (env flag): POST /api/aurora/chat (Claude, gated server-side).
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type { MacroComposite } from '@/lib/macro/composite';
import { COMPANION_QUICK_ACTIONS } from '@/lib/companion/intent-router';
import { isClientLlmBetaVisible } from '@/lib/companion/config';
import ChatMessage from './ChatMessage';

export interface ChatWindowProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  composite?: MacroComposite;
  /** When true, renders inline (full page) instead of overlay dialog. */
  embedded?: boolean;
}

interface TurnView {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  triggered: boolean;
}

interface CompanionTurnResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  mode: 'companion';
}

interface LlmTurnResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  turnIndex: number;
}

const WELCOME_KO =
  'Aurora 🕊 페이스 컴패니언이에요. 아래 버튼이나 짧은 질문으로 매크로·plan·분할매수·trigger·IPS를 확인해 보세요.';

const LLM_BETA_VISIBLE = isClientLlmBetaVisible();

async function postCompanionTurn(input: {
  message?: string;
  quickActionId?: string;
  composite?: MacroComposite;
}): Promise<CompanionTurnResponse> {
  const res = await fetch('/api/companion/turn', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`companion_http_${res.status}`);
  }
  return (await res.json()) as CompanionTurnResponse;
}

async function postLlmTurn(input: {
  sessionId: string;
  message: string;
  composite?: MacroComposite;
}): Promise<LlmTurnResponse> {
  const res = await fetch('/api/aurora/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let serverText: string | undefined;
    try {
      const body = (await res.json()) as { text?: string };
      if (typeof body.text === 'string') serverText = body.text;
    } catch {
      /* non-JSON */
    }
    const err = new Error(`chat_http_${res.status}`);
    (err as Error & { serverText?: string }).serverText = serverText;
    throw err;
  }
  return (await res.json()) as LlmTurnResponse;
}

export default function ChatWindow({
  open,
  onClose,
  sessionId,
  composite,
  embedded = false,
}: ChatWindowProps) {
  const headerId = useId();
  const disclaimerId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<Element | null>(null);

  const [turns, setTurns] = useState<TurnView[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME_KO, triggered: false },
  ]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [useLlmBeta, setUseLlmBeta] = useState(false);

  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement;
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    const prev = previousActiveRef.current;
    if (prev instanceof HTMLElement) prev.focus();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [open, turns.length]);

  const appendAssistant = useCallback((text: string, triggered: boolean, id: string) => {
    setTurns((prev) => [...prev, { id, role: 'assistant', text, triggered }]);
  }, []);

  const runCompanion = useCallback(
    async (input: { message?: string; quickActionId?: string; userLabel: string }) => {
      if (pending) return;
      setTurns((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          role: 'user',
          text: input.userLabel,
          triggered: false,
        },
      ]);
      setPending(true);
      try {
        const res = await postCompanionTurn({
          message: input.message,
          quickActionId: input.quickActionId,
          composite,
        });
        appendAssistant(res.text, res.triggered, `a-${Date.now()}`);
      } catch {
        appendAssistant(
          '잠시 연결할 수 없어요. 대시보드와 설정에서 plan·IPS를 확인해 주세요.',
          false,
          `a-err-${Date.now()}`,
        );
      } finally {
        setPending(false);
      }
    },
    [appendAssistant, composite, pending],
  );

  const onQuickAction = useCallback(
    (id: string, label: string) => {
      void runCompanion({ quickActionId: id, userLabel: label });
    },
    [runCompanion],
  );

  const onSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const text = draft.trim();
      if (text.length === 0 || pending) return;

      setDraft('');

      if (useLlmBeta && LLM_BETA_VISIBLE) {
        setTurns((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, role: 'user', text, triggered: false },
        ]);
        setPending(true);
        try {
          const res = await postLlmTurn({ sessionId, message: text, composite });
          appendAssistant(res.text, res.triggered, `a-${res.turnIndex}`);
        } catch (err) {
          const serverText =
            (err as Error & { serverText?: string }).serverText ??
            'AI Beta를 사용할 수 없어요. 페이스 컴패니언 버튼을 이용해 주세요.';
          appendAssistant(serverText, false, `a-err-${Date.now()}`);
        } finally {
          setPending(false);
        }
        return;
      }

      await runCompanion({ message: text, userLabel: text });
    },
    [appendAssistant, composite, draft, pending, runCompanion, sessionId, useLlmBeta],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') return;
      const target = e.currentTarget;
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        target.setRangeText('\n', target.selectionStart, target.selectionEnd, 'end');
        setDraft(target.value);
        return;
      }
      if (e.shiftKey) return;
      const caretAtEnd =
        target.selectionStart === target.value.length &&
        target.selectionEnd === target.value.length;
      if (caretAtEnd && target.value.trim().length > 0) {
        e.preventDefault();
        void onSubmit();
      }
    },
    [onSubmit],
  );

  if (!open && !embedded) return null;

  const panel = (
    <div
      role={embedded ? undefined : 'dialog'}
      aria-modal={embedded ? undefined : true}
      aria-labelledby={headerId}
      className={
        embedded
          ? 'flex h-full min-h-[420px] flex-col rounded-2xl border border-cohort-ink-10 bg-white shadow-sm'
          : 'flex h-full w-full flex-col bg-white shadow-mascot-aurora md:h-[600px] md:max-h-[80vh] md:w-[400px] md:rounded-2xl'
      }
    >
        <header className="flex items-center justify-between gap-2 border-b border-cohort-ink-10 px-4 py-3">
          <div>
            <h2
              id={headerId}
              className="break-keep text-base font-medium text-cohort-ink-90"
            >
              <span aria-hidden="true">🕊</span> Aurora 페이스 컴패니언
            </h2>
            <p className="text-[11px] text-cohort-ink-50">규칙 기반 · API 과금 없음</p>
          </div>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              aria-label="페이스 컴패니언 닫기"
              className="flex h-11 w-11 items-center justify-center rounded-full text-cohort-ink-70 transition-colors duration-fast ease-out hover:bg-cohort-ink-05 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cohort-primary"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          )}
        </header>

        {LLM_BETA_VISIBLE && (
          <div className="border-b border-cohort-ink-10 bg-cohort-ivory px-3 py-2">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs text-cohort-charcoal break-keep">
              <input
                type="checkbox"
                checked={useLlmBeta}
                onChange={(e) => setUseLlmBeta(e.target.checked)}
                className="h-4 w-4 accent-cohort-primary"
              />
              AI Beta (실험 · Claude · Pro 예정)
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-cohort-ink-10 bg-cohort-ivory px-3 py-2">
          {COMPANION_QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={pending}
              onClick={() => onQuickAction(action.id, action.label)}
              className="min-h-[36px] rounded-full border border-cohort-ink-10 bg-white px-3 text-xs text-cohort-charcoal break-keep hover:border-cohort-primary/40 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div
          role="log"
          aria-live="polite"
          aria-label="Aurora 페이스 컴패니언 기록"
          className="flex flex-1 flex-col gap-3 overflow-y-auto bg-cohort-ivory px-3 py-4"
        >
          {turns.map((t) => (
            <ChatMessage
              key={t.id}
              message={{ role: t.role, text: t.text }}
              triggered={t.triggered}
            />
          ))}
          {pending ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 px-2"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-2 w-2 rounded-full bg-cohort-ink-30 motion-safe:animate-pulse"
              />
              <span className="text-xs text-cohort-ink-50">응답 준비 중…</span>
            </div>
          ) : null}
          <div ref={listEndRef} aria-hidden="true" />
        </div>

        <form
          onSubmit={onSubmit}
          className="flex items-end gap-2 border-t border-cohort-ink-10 bg-white px-3 py-3"
        >
          <label htmlFor={`${headerId}-input`} className="sr-only">
            Aurora에게 보낼 메시지
          </label>
          <textarea
            id={`${headerId}-input`}
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              useLlmBeta && LLM_BETA_VISIBLE
                ? 'AI Beta 질문 (Enter 전송)'
                : '키워드 질문 (예: plan, trigger, 매크로)'
            }
            rows={2}
            maxLength={2000}
            disabled={pending}
            aria-describedby={disclaimerId}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-cohort-ink-10 bg-white px-3 py-2 text-sm text-cohort-ink-90 placeholder:text-cohort-ink-30 focus:border-cohort-primary focus:outline-none disabled:bg-cohort-ink-05"
          />
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            aria-label="메시지 전송"
            className="flex h-11 min-w-[44px] items-center justify-center rounded-xl bg-cohort-primary px-4 text-sm font-medium text-white transition-colors duration-fast ease-out hover:bg-cohort-charcoal disabled:bg-cohort-ink-30 disabled:text-cohort-ink-50"
          >
            전송
          </button>
        </form>

        <p
          id={disclaimerId}
          className="break-keep border-t border-cohort-ink-05 bg-cohort-ivory px-4 py-2 text-center text-xs text-cohort-ink-50"
        >
          정보 + 의사결정 지원 도구입니다. 투자 자문이 아닙니다.
        </p>
      </div>
  );

  if (embedded) return panel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {panel}
    </div>
  );
}
