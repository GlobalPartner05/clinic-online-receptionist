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
export function useSpeechInput(onFinal: (text: string) => void, onSilence?: () => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const gotResult = useRef(false);
  const cb = useRef(onFinal);
  cb.current = onFinal;
  const silenceCb = useRef(onSilence);
  silenceCb.current = onSilence;
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
    gotResult.current = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) {
        gotResult.current = true;
        cb.current(text);
      }
    };
    rec.onend = () => {
      const wasActive = recRef.current === rec;
      recRef.current = null;
      setListening(false);
      if (wasActive && !gotResult.current) silenceCb.current?.();
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

/** Prefer a natural-sounding English voice: Philippine English first, then US/UK, preferring neural/online voices. */
export function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (/en[-_]PH/i.test(v.lang) ? 40 : /en[-_]US/i.test(v.lang) ? 20 : /en[-_]GB/i.test(v.lang) ? 15 : 0) +
    (/natural|neural|online|google/i.test(v.name) ? 25 : 0) +
    (v.localService ? 0 : 5);
  return voices.slice().sort((a, b) => score(b) - score(a))[0];
}

/** Read text aloud. `text` should already be speakable (the server returns a `speech` field for chat replies). */
export function speak(text: string, onEnd?: () => void) {
  if (typeof speechSynthesis === 'undefined' || !text.trim()) {
    onEnd?.();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = 'en-PH';
  }
  u.rate = 0.98;
  let done = false;
  const end = () => {
    if (!done) {
      done = true;
      onEnd?.();
    }
  };
  u.onend = end;
  u.onerror = end;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
