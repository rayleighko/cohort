'use client';

import { useEffect, useState } from 'react';
import ChatWindow from '@/components/aurora/ChatWindow';

const SESSION_STORAGE_KEY = 'cohort.aurora.chat.session_id';

function readOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

export default function CompanionPageClient() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(readOrCreateSessionId());
  }, []);

  if (!sessionId) return null;

  return (
    <ChatWindow
      open
      embedded
      onClose={() => {}}
      sessionId={sessionId}
    />
  );
}
