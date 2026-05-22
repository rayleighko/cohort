'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import MascotAvatar from '@/components/mascot/MascotAvatar';
import Disclaimer from '@/components/ui/Disclaimer';
import type { MascotCharacter } from '@/types/mascot';

/**
 * MascotChatBubble — always-accessible Aurora/Vesper chat.
 * FAB (bottom-right) → mobile-first bottom-sheet panel. Rendered in the
 * (dashboard) layout so it appears on every authenticated route.
 *
 * Aurora is the default voice; Vesper is opt-in via the top toggle.
 * Sends to /api/mascot (3-layer safety filter runs server-side); hydrates
 * the last 20 turns from mascot_chat (RLS-scoped); persists the character
 * choice to localStorage.
 */

interface ChatMessage {
  role: 'user' | 'mascot';
  content: string;
  character: MascotCharacter;
  triggered?: boolean;
}

const CHARACTER_STORAGE_KEY = 'cohort.mascot.character';

export default function MascotChatBubble() {
  const [open, setOpen] = useState(false);
  const [character, setCharacter] = useState<MascotCharacter>('aurora');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Restore the character preference.
  useEffect(() => {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (saved === 'aurora' || saved === 'vesper') setCharacter(saved);
  }, []);

  // Hydrate the last 20 turns the first time the panel opens.
  useEffect(() => {
    if (!open || hydrated) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('mascot_chat')
        .select('role, content, character, safety_filter_triggered, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled && data) {
        setMessages(
          [...data].reverse().map((r) => ({
            role: r.role === 'user' ? 'user' : 'mascot',
            content: r.content,
            character: r.character === 'vesper' ? 'vesper' : 'aurora',
            triggered: r.safety_filter_triggered ?? false,
          })),
        );
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, hydrated]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const pickCharacter = useCallback((c: MascotCharacter) => {
    setCharacter(c);
    localStorage.setItem(CHARACTER_STORAGE_KEY, c);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setMessages((m) => [...m, { role: 'user', content: text, character }]);
    setInput('');
    try {
      const res = await fetch('/api/mascot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, character }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        res.ok && data.content
          ? {
              role: 'mascot',
              content: data.content,
              character,
              triggered: Boolean(data.safety_filter_triggered),
            }
          : {
              role: 'mascot',
              content: '잠시 후 다시 시도해주세요.',
              character,
            },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'mascot',
          content: '연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
          character,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, character]);

  // --- FAB (collapsed) -------------------------------------------------------
  if (!open) {
    return (
      <button
        type="button"
        aria-label="Aurora · Vesper 채팅 열기"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cohort-primary shadow-lg active:scale-95"
      >
        <MascotAvatar character={character} state="calm" size={40} />
      </button>
    );
  }

  // --- Bottom-sheet panel (expanded) ----------------------------------------
  const toggleBtn = (c: MascotCharacter, label: string) => (
    <button
      type="button"
      onClick={() => pickCharacter(c)}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors ${
        character === c
          ? 'bg-cohort-primary text-cohort-ivory'
          : 'bg-cohort-ivory text-cohort-charcoal/60'
      }`}
    >
      <MascotAvatar character={c} state="calm" size={22} />
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-cohort-charcoal/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-[85vh] flex-col rounded-t-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — character toggle */}
        <div className="flex items-center gap-2 border-b border-cohort-charcoal/10 p-3">
          {toggleBtn('aurora', 'Aurora 🕊 동행')}
          {toggleBtn('vesper', 'Vesper 🦅 신호')}
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center text-xl text-cohort-charcoal/50"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-cohort-charcoal/45">
              {character === 'aurora'
                ? 'Aurora 🕊와 천천히 이야기해요. 본인 plan, 같이 점검해봐요.'
                : 'Vesper 🦅에게 신호를 물어보세요. 판단은 본인 plan 기준으로.'}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cohort-primary text-cohort-ivory'
                    : 'bg-cohort-ivory text-cohort-charcoal'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-cohort-charcoal/10 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="메시지를 입력하세요"
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-cohort-charcoal/15 px-3 py-2.5 text-base outline-none focus:border-cohort-primary"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              className="min-h-[44px] rounded-xl bg-cohort-primary px-4 text-sm font-semibold text-cohort-ivory disabled:opacity-50"
            >
              {sending ? '…' : '보내기'}
            </button>
          </div>
          <div className="mt-2">
            <Disclaimer compact />
          </div>
        </div>
      </div>
    </div>
  );
}
