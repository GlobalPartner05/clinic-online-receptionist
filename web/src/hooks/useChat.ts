import { useCallback, useEffect, useRef, useState } from 'react';
import { CLINIC } from '../config/clinic';

export interface ChatMessage {
  id: number;
  role: 'user' | 'bot' | 'system';
  text: string;
  receiptUrl?: string;
}

export type AgentMode = 'local' | 'base44';

const SESSION_KEY = CLINIC.sessionKey;

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSessionId(): string {
  const s = safeStorage();
  let id = s?.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    s?.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Pulls the first receipt link out of a reply, normalised to the SPA route. */
export function extractReceiptUrl(text: string, bookedUrl?: string): string | undefined {
  const raw = bookedUrl ?? text.match(/\/receipt(?:\.html\?id=|\/)([A-Za-z0-9-]+)/)?.[0];
  if (!raw) return undefined;
  const id = raw.match(/(?:id=|\/receipt\/)([A-Za-z0-9-]+)$/)?.[1] ?? raw.match(/([A-Za-z0-9-]{8,})$/)?.[1];
  return id ? `/receipt/${id}` : undefined;
}

const WELCOME: ChatMessage = {
  id: 0,
  role: 'bot',
  text: CLINIC.welcome,
};

export function useChat(initialMode: AgentMode = 'local') {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const nextId = useRef(1);
  const sessionId = useRef('');

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  const push = useCallback((m: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...m, id: nextId.current++ }]);
  }, []);

  const send = useCallback(
    async (raw: string): Promise<string | undefined> => {
      const message = raw.trim();
      if (!message || busy) return;
      push({ role: 'user', text: message });
      setBusy(true);
      try {
        const res = await fetch(mode === 'base44' ? '/api/base44/chat' : '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId: sessionId.current || getSessionId(), mode }),
        });
        let data: { reply?: string; error?: string; booked?: { receipt_url?: string } } = {};
        try {
          data = await res.json();
        } catch {
          /* non-JSON body */
        }
        if (!res.ok || (!data.reply && data.error)) {
          const t = data.error ?? `Sorry, something went wrong (${res.status}). Please try again.`;
          push({ role: 'system', text: t });
          return t;
        }
        const reply = data.reply ?? 'Thank you for your message.';
        push({ role: 'bot', text: reply, receiptUrl: extractReceiptUrl(reply, data.booked?.receipt_url) });
        return reply;
      } catch {
        const t = 'Connection problem. Please check your internet and try again.';
        push({ role: 'system', text: t });
        return t;
      } finally {
        setBusy(false);
      }
    },
    [busy, mode, push],
  );

  const clear = useCallback(() => {
    setMessages([WELCOME]);
  }, []);

  return { messages, busy, mode, setMode, send, clear };
}
