import { useEffect, useRef, useState } from 'react';
import { CLINIC } from '../config/clinic';
import { speak, stopSpeaking, useSpeechInput } from '../hooks/useSpeech';
import { getSessionId } from '../hooks/useChat';
import { RemotionClip, type Clip } from './RemotionPlayer';
import { Receptionist } from './Receptionist';

interface Line { who: 'you' | 'clinic'; text: string }

export function CallModal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const draftRef = useRef<unknown>(null);
  const alive = useRef(true);
  const micRef = useRef<{ start: () => boolean; stop: () => void } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [note, setNote] = useState('');
  const dlg = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(document.activeElement);

  const handle = async (text: string) => {
    setLines((l) => [...l, { who: 'you', text }]);
    setBusy(true);
    let reply = 'The line dropped. Please try again.';
    let spoken = reply;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: getSessionId(), draft: draftRef.current }),
      });
      const data = (await res.json()) as { reply?: string; speech?: string; draft?: unknown; error?: string };
      if (res.ok && data.reply) {
        draftRef.current = data.draft ?? null;
        reply = data.reply;
        spoken = data.speech ?? data.reply;
      } else {
        reply = spoken = data.error ?? 'Sorry, I could not process that.';
      }
    } catch {
      /* keep the dropped-line message */
    }
    setLines((l) => [...l, { who: 'clinic', text: reply }]);
    setBusy(false);
    if (!alive.current) return;
    setSpeaking(true);
    speak(spoken, () => {
      if (!alive.current) return;
      setSpeaking(false);
      micRef.current?.start(); // a call is hands-free: listen again after the receptionist finishes
    });
  };
  const mic = useSpeechInput(
    (t) => void handle(t),
    () => setNote('I didn’t hear anything. Tap Speak when you’re ready.'),
  );
  micRef.current = mic;

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const root = dlg.current!;
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>('button, input, [href]')).filter((e) => !e.hasAttribute('disabled'));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    alive.current = false;
    mic.stop();
    stopSpeaking();
    onClose();
    (opener.current as HTMLElement | null)?.focus?.();
  }

  const toggle = () => {
    setNote('');
    stopSpeaking();
    if (mic.listening) return mic.stop();
    if (!mic.start()) setNote('Voice isn’t supported in this browser. Use the chat instead.');
  };

  const wave: Clip = {
    id: 'ReceptionistWave', width: 800, height: 160, poster: '/images/posters/wave.webp', alt: 'Call activity',
    inputProps: { state: mic.listening ? 'listening' : speaking ? 'speaking' : 'idle' },
  };
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={dlg} className="modal call" role="dialog" aria-modal="true" aria-labelledby="call-title">
        <h3 id="call-title">{CLINIC.name} — virtual call <span className="muted" aria-label={`Call time ${mm}:${ss}`}>{mm}:{ss}</span></h3>
        <div className="call-face"><Receptionist size={112} state={mic.listening ? 'listening' : speaking ? 'speaking' : busy ? 'thinking' : 'idle'} /></div>
        <RemotionClip clip={wave} className="wave" />
        <div className="transcript" role="log" aria-live="polite">
          {lines.length === 0 && <p className="muted">Tap Speak and say what you need, for example “I want a cleaning next Monday”. I’ll listen again after each answer.</p>}
          {lines.map((l, i) => (<p key={i} className={l.who}><strong>{l.who === 'you' ? 'You' : 'Clinic'}:</strong> {l.text}</p>))}
          {busy && <p className="muted">…</p>}
        </div>
        <p className="small muted" role="status">{note}</p>
        <div className="row-gap">
          <button className={`btn ${mic.listening ? 'btn-danger' : 'btn-primary'}`} onClick={toggle} aria-pressed={mic.listening}>
            {mic.listening ? 'Stop listening' : '🎙️ Speak'}
          </button>
          <button className="btn btn-ghost" onClick={close}>End call</button>
        </div>
      </div>
    </div>
  );
}
