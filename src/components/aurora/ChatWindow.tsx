'use client';

/**
 * Aurora 🕊 chat window — Client component overlay.
 *
 * Mobile: full-screen overlay (mobile-first PWA strict per 38-brief).
 * Md+: bottom-right card 400×600px constrained.
 *
 * Day 11 (W3 Day 1 scaffold) scope cap:
 * - Tier 0 anonymous session_id (client-generated UUID in sessionStorage)
 * - No history hydration on mount (fresh-conversation UX); history is fetched
 *   server-side per /api/aurora/chat turn for prompt context
 * - No markdown rendering, no rich UI, no voice input, no images
 *
 * Accessibility:
 * - role="dialog" aria-modal="true" with aria-labelledby on the header
 * - focus moves to the input on open + restores to the trigger on close
 * - Escape closes; outside-tap on overlay closes (md+) or back button (mobile)
 * - aria-live="polite" on message list so new turns are announced
 *
 * Composite context: optionally passed in for the system prompt's macro
 * preamble. Day 11 sources composite from the parent dashboard.
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
import type { ChatMessage as ChatMessageData } from '@/lib/aurora/chat-prompt';
import ChatMessage from './ChatMessage';

export interface ChatWindowProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  composite?: MacroComposite;
}

interface TurnView {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  triggered: boolean;
}

interface ChatTurnResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  sessionId: string;
  turnIndex: number;
}

const WELCOME_KO =
  '안녕하세요. Aurora 🕊 입니다. 매크로 지표나 본인 plan reference, 또는 멘탈 관리 관련 질문 있으시면 천천히 적어주세요.';

async function postTurn(input: {
  sessionId: string;
  message: string;
  composite?: MacroComposite;
}): Promise<ChatTurnResponse> {
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
      /* non-JSON body */
    }
    const err = new Error(`chat_http_${res.status}`);
    (err as Error & { serverText?: string }).serverText = serverText;
    throw err;
  }
  return (await res.json()) as ChatTurnResponse;
}

export default function ChatWindow({
  open,
  onClose,
  sessionId,
  composite,
}: ChatWindowProps) {
  const headerId = useId();
  const disclaimerId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<Element | null>(null);

  const [turns, setTurns] = useState<TurnView[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: WELCOME_KO,
      triggered: false,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);

  // Focus management — move focus to input on open; restore on close (a11y).
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement;
      // requestAnimationFrame to ensure the input is mounted + visible.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    const prev = previousActiveRef.current;
    if (prev instanceof HTMLElement) {
      prev.focus();
    }
    return undefined;
  }, [open]);

  // Escape closes.
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

  // Scroll to bottom on new turn (motion-reduce respects 'auto' default).
  useEffect(() => {
    if (!open) return;
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [open, turns.length]);

  const onSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const text = draft.trim();
      if (text.length === 0 || pending) return;

      const userTurn: TurnView = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        triggered: false,
      };
      setTurns((prev) => [...prev, userTurn]);
      setDraft('');
      setPending(true);

      try {
        const res = await postTurn({ sessionId, message: text, composite });
        setTurns((prev) => [
          ...prev,
          {
            id: `a-${res.turnIndex}`,
            role: 'assistant',
            text: res.text,
            triggered: res.triggered,
          },
        ]);
      } catch (err) {
        const serverText =
          (err as Error & { serverText?: string }).serverText ??
          '[Aurora가 잠시 자리를 비웠습니다. 잠시 후 다시 시도해주세요.]';
        setTurns((prev) => [
          ...prev,
          {
            id: `a-err-${Date.now()}`,
            role: 'assistant',
            text: serverText,
            triggered: false,
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [composite, draft, pending, sessionId],
  );

  // Caret-aware Enter contract (사장님 spec 2026-05-24):
  //   • Enter at end of textarea (and non-empty draft) → send
  //   • Enter mid-textarea                              → newline (default)
  //   • Shift+Enter (anywhere)                          → newline (default)
  //   • Cmd (mac) / Ctrl (win) + Enter (anywhere)       → newline (intentional)
  // Cmd/Ctrl+Enter is a no-op in native textarea, so we manually splice '\n'
  // at the caret via setRangeText (auto-updates selection + scroll).
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') return;

      const target = e.currentTarget;

      // Cmd/Ctrl+Enter → 명시적 개행
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        target.setRangeText('\n', target.selectionStart, target.selectionEnd, 'end');
        setDraft(target.value);
        return;
      }

      // Shift+Enter → textarea default newline; nothing to override
      if (e.shiftKey) return;

      // 일반 Enter — caret 위치 + non-empty draft check
      const caretAtEnd =
        target.selectionStart === target.value.length &&
        target.selectionEnd === target.value.length;

      if (caretAtEnd && target.value.trim().length > 0) {
        e.preventDefault();
        void onSubmit();
      }
      // caret 중간 또는 empty draft면 default behavior (newline insert)
    },
    [onSubmit],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end md:p-6"
      onClick={(e) => {
        // Outside-tap closes ONLY on md+ where the window is a bottom-right
        // card. Mobile full-screen overlay does not close on outside-tap
        // (there is no outside — the overlay fills the viewport).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerId}
        className="flex h-full w-full flex-col bg-white shadow-mascot-aurora md:h-[600px] md:max-h-[80vh] md:w-[400px] md:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-2 border-b border-cohort-ink-10 px-4 py-3">
          <h2
            id={headerId}
            className="break-keep text-base font-medium text-cohort-ink-90"
          >
            <span aria-hidden="true">🕊</span>{' '}
            <span>Aurora와 대화</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Aurora 대화 닫기"
            className="flex h-11 w-11 items-center justify-center rounded-full text-cohort-ink-70 transition-colors duration-fast ease-out hover:bg-cohort-ink-05 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cohort-primary"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </header>

        <div
          role="log"
          aria-live="polite"
          aria-label="Aurora 대화 기록"
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
              aria-label="Aurora 응답 생성 중"
              className="flex items-center gap-2 px-2"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-2 w-2 rounded-full bg-cohort-ink-30 motion-safe:animate-pulse"
              />
              <span className="text-xs text-cohort-ink-50">Aurora 응답 준비 중…</span>
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
            placeholder="질문을 적어주세요 (Enter 전송 · Shift/⌘Enter 줄바꿈)"
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
    </div>
  );
}
