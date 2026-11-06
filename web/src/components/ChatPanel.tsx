import { useEffect, useRef, useState } from 'react';
import { CLINIC, QUICK_CHIPS } from '../config/clinic';
import { useChat } from '../hooks/useChat';
import { speak, stopSpeaking, useSpeechInput } from '../hooks/useSpeech';
import { RemotionClip, type Clip } from './RemotionPlayer';
import { CallModal } from './CallModal';
import { Receptionist, type ReceptionistState } from './Receptionist';

export interface Pending {
  text: string;
  nonce: number;
}

const waveClip = (state: 'idle' | 'listening' | 'speaking'): Clip => ({
  id: 'ReceptionistWave',
  width: 800,
  height: 160,
  poster: '/images/posters/wave.webp',
  alt: `Receptionist is ${state}`,
  inputProps: { state },
});

export function ChatPanel({ pending }: { pending: Pending | null }) {
  const { messages, busy, mode, setMode, send, clear } = useChat('local');
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [micNote, setMicNote] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const lastNonce = useRef(0);

  const submit = async (text: string) => {
    const reply = await send(text);
    if (reply && voiceReply.current) {
      setSpeaking(true);
      speak(reply, () => setSpeaking(false));
    }
  };
  const voiceReply = useRef(false);
  const mic = useSpeechInput((t) => {
    voiceReply.current = true;
    void submit(t);
  });

  useEffect(() => {
    if (pending && pending.nonce !== lastNonce.current) {
      lastNonce.current = pending.nonce;
      voiceReply.current = false;
      void submit(pending.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => stopSpeaking(), []);

  const state = mic.listening ? 'listening' : speaking ? 'speaking' : 'idle';
  const face: ReceptionistState = busy ? 'thinking' : state;

  const toggleMic = () => {
    setMicNote('');
    if (mic.listening) return mic.stop();
    if (!mic.start()) setMicNote('Voice input isn’t supported in this browser — please type instead.');
  };

  return (
    <div className="assistant">
      <div className="assistant-head">
        <div className="assistant-id">
          <Receptionist size={64} state={face} />
          <div>
            <h3>{CLINIC.receptionistName}</h3>
            <p className="muted small" aria-live="polite">
              24/7 AI receptionist · {mic.listening ? 'Listening…' : speaking ? 'Speaking…' : busy ? 'Typing…' : 'Online now'}
            </p>
          </div>
        </div>
        <div className="seg" role="group" aria-label="Assistant">
          <button aria-pressed={mode === 'local'} onClick={() => setMode('local')}>{CLINIC.shortName}</button>
          <button aria-pressed={mode === 'base44'} onClick={() => setMode('base44')}>Base44</button>
        </div>
      </div>

      <RemotionClip clip={waveClip(state)} className="wave" />

      <div ref={log} className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.role !== 'user' && <Receptionist size={32} ring={false} />}
            <span className="bubble">
              {m.text}
              {m.receiptUrl && (
                <a className="receipt-link" href={m.receiptUrl} target="_blank" rel="noopener noreferrer">
                  📄 View proof of appointment
                </a>
              )}
            </span>
          </div>
        ))}
        {busy && (
          <div className="msg bot" aria-hidden>
            <Receptionist size={32} ring={false} state="thinking" />
            <span className="bubble typing"><i /><i /><i /></span>
          </div>
        )}
      </div>

      <div className="chips" aria-label="Quick actions">
        {QUICK_CHIPS.map((c) => (
          <button key={c} className="chip" disabled={busy} onClick={() => { voiceReply.current = false; void submit(c); }}>
            {c}
          </button>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft;
          setDraft('');
          voiceReply.current = false;
          void submit(t);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">Message the receptionist</label>
        <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message, e.g. “Check slots tomorrow”" autoComplete="off" maxLength={500} />
        <button type="button" className={`icon-btn ${mic.listening ? 'on' : ''}`} onClick={toggleMic} aria-pressed={mic.listening} aria-label={mic.listening ? 'Stop voice input' : 'Start voice input'}>🎙️</button>
        <button type="button" className="icon-btn" onClick={() => setCallOpen(true)} aria-label="Start voice call with the receptionist">📞</button>
        <button className="btn btn-primary" disabled={busy || !draft.trim()}>Send</button>
      </form>
      <div className="row-between small">
        <span className="muted" role="status">{micNote}</span>
        <button className="link-btn" onClick={clear}>Clear chat</button>
      </div>

      {callOpen && <CallModal onClose={() => setCallOpen(false)} />}
    </div>
  );
}
