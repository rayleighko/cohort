'use client';

/**
 * Aurora 🕊 chat bubble — always-accessible floating CTA.
 *
 * Day 11 (W3 Day 1 scaffold). Bottom-right floating button on the dashboard;
 * tap opens ChatWindow. Mobile-first PWA strict per 38-brief — 44×44px+ touch
 * target, z-index above dashboard content, visible on every dashboard surface.
 *
 * Session_id is client-generated UUID held in sessionStorage. Anonymous
 * Tier 0 (Day 11); W5 Day 4 chat full will optionally bind to auth.uid().
 *
 * Idle visual = subtle pulse on the Aurora sigil (motion-safe only — respects
 * prefers-reduced-motion). No notification dot, no urgency framing per 38 §2.2
 * (the dovish/patient register applies to chrome too, not just content).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MacroComposite } from '@/lib/macro/composite';

// ChatWindow ships only when the user opens chat — keeps initial bundle lean.
const ChatWindow = dynamic(() => import('./ChatWindow'), { ssr: false });

export interface MascotChatBubbleProps {
  composite?: MacroComposite;
}

const SESSION_STORAGE_KEY = 'cohort.aurora.chat.session_id';

/**
 * Generates a UUID v4 — uses crypto.randomUUID when available, otherwise
 * builds a v4-shaped string via crypto.getRandomValues. The fallback MUST
 * match the server's UUID_RE in /api/aurora/chat (8-4-4-4-12 hex with
 * version=4 + variant=8/9/a/b nibbles) or every chat POST 400s.
 */
function generateUuidV4(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  // Manual v4 builder — RFC 4122 §4.4. Uses getRandomValues when available,
  // falls back to Math.random as a last-resort that still emits a valid v4.
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function readOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length > 0) return existing;
    const fresh = generateUuidV4();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // SessionStorage blocked (privacy mode) — fall back to in-memory id; chat
    // history still works within the page session, just not across reloads.
    return generateUuidV4();
  }
}

export default function MascotChatBubble({ composite }: MascotChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSessionId(readOrCreateSessionId());
  }, []);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => {
    setOpen(false);
    // Restore focus to the trigger — ChatWindow's effect handles previous
    // active element, but the bubble is the canonical re-entry.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onOpen}
        aria-label="Aurora 페이스 컴패니언 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
        // bottom positioning honors PWA-installed iPhone X+ safe-area inset
        // (41 §4.2 SCR-2). `max()` falls back to vault spec floors (24px mobile
        // / 32px ≥md per 41 §3.1) when no safe area is present.
        style={{
          bottom: 'max(env(safe-area-inset-bottom), 24px)',
          right: 'max(env(safe-area-inset-right), 16px)',
        }}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cohort-primary text-2xl text-white shadow-mascot-aurora transition-transform duration-fast ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cohort-primary motion-safe:animate-pulse motion-safe:hover:scale-105 motion-reduce:animate-none"
      >
        <span aria-hidden="true">🕊</span>
      </button>
      {sessionId.length > 0 ? (
        <ChatWindow
          open={open}
          onClose={onClose}
          sessionId={sessionId}
          composite={composite}
        />
      ) : null}
    </>
  );
}
