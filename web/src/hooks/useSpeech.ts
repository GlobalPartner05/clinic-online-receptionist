import { useCallback, useEffect, useRef, useState } from 'react';

interface SRResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SR {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SRResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRCtor = new () => SR;

function getCtor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Push-to-talk recogniser. Each hook instance owns its own recogniser, so chat and call mics never share handlers. */
export function useSpeechInput(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const cb = useRef(onFinal);
  cb.current = onFinal;
  const supported = typeof window !== 'undefined' && !!getCtor();

  const stop = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return false;
    stop();
    const rec = new Ctor();
    rec.lang = 'en-PH';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) cb.current(text);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    rec.onerror = rec.onend;
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      return true;
    } catch {
      setListening(false);
      return false;
    }
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { supported, listening, start, stop };
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof speechSynthesis === 'undefined') {
    onEnd?.();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\[Receipt:[^\]]*\]/g, '').replace(/https?:\/\/\S+|\/receipt\S+/g, ''));
  u.lang = 'en-PH';
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
