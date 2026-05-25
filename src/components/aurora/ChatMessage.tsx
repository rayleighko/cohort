'use client';

/**
 * Aurora 🕊 chat message bubble — Client component.
 *
 * Single message render. User messages are right-aligned (cohort primary
 * accent), assistant messages are left-aligned with the Aurora sigil as a
 * placeholder avatar (Pre-W5 illustrator commissioning per 43-mascot-brief).
 *
 * The `triggered` flag is a quiet visual marker — a subtle info-tinted
 * background, never alarming, never apology-tone. The user already saw the
 * redirect text; the marker is only a subtle "this was the safety boundary".
 * W3 Mon Day 1: migrated from `border-l-4 border-l-cohort-info` to a
 * `bg-cohort-info/[0.06]` tint for consistency with the dashboard-wide
 * Notion-block aesthetic (사장님 "카드 좌측 보더" complaint).
 *
 * Korean body uses `break-keep` to preserve Korean cluster word boundaries.
 * No markdown rendering — Aurora's system prompt forbids markdown by contract
 * and the body is rendered as plain text to keep the safety surface tight.
 */
import type { ChatMessage as ChatMessageData } from '@/lib/aurora/chat-prompt';

export interface ChatMessageProps {
  message: ChatMessageData;
  triggered?: boolean;
}

export default function ChatMessage({
  message,
  triggered = false,
}: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-cohort-primary px-4 py-2 text-white shadow-sm">
          <p className="break-keep text-sm leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start gap-2">
      <div
        aria-hidden="true"
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cohort-ink-05 text-base shadow-mascot-aurora"
      >
        <span>🕊</span>
      </div>
      <div
        className={`max-w-[80%] rounded-2xl rounded-tl-md px-4 py-2 shadow-sm ${
          triggered ? 'bg-cohort-info/[0.06]' : 'bg-white'
        }`}
      >
        <p className="break-keep text-sm leading-relaxed text-cohort-ink-90">
          {message.text}
        </p>
        {triggered ? (
          <p className="mt-1 break-keep text-xs text-cohort-ink-50">
            Cohort 정보 + 도구 안내 (자문업 아님)
          </p>
        ) : null}
      </div>
    </div>
  );
}
