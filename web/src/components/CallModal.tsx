import { useEffect, useRef, useState } from 'react';
import { CLINIC } from '../config/clinic';
import { speak, stopSpeaking, useSpeechInput } from '../hooks/useSpeech';
import { RemotionClip, type Clip } from './RemotionPlayer';
import { Receptionist } from './Receptionist';

interface Line { who: 'you' | 'clinic'; text: string }

export function CallModal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [phone, setPhone] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [note, setNote] = useState('');
  const dlg = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(document.activeElement);

  const handle = async (text: string) => {
    setLines((l) => [...l, { who: 'you', text }]);
    setBusy(true);
    try {
      const res = await fetch('/api/calls/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SpeechResult: text, ...(phone.trim() ? { From: phone.trim() } : {}) }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply ?? 'Sorry, I could not process that.';
      setLines((l) => [...l, { who: 'clinic', text: reply }]);
      setSpeaking(true);
      speak(reply, () => setSpeaking(false));
    } catch {
      setLines((l) => [...l, { who: 'clinic', text: 'The line dropped. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };
  const mic = useSpeechInput((t) => void handle(t));

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
          {lines.length === 0 && <p className="muted">Tap the microphone and speak. Your browser will ask for permission.</p>}
          {lines.map((l, i) => (<p key={i} className={l.who}><strong>{l.who === 'you' ? 'You' : 'Clinic'}:</strong> {l.text}</p>))}
          {busy && <p className="muted">…</p>}
        </div>
        <label className="small muted" htmlFor="call-phone">Your mobile number (optional, used for booking)</label>
        <input id="call-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XX XXX XXXX" autoComplete="tel" />
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
