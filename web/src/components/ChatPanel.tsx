import { useEffect, useRef, useState } from 'react';
import { QUICK_CHIPS } from '../config/clinic';
import { useChat } from '../hooks/useChat';
import { speak, stopSpeaking, useSpeechInput } from '../hooks/useSpeech';
import { CallModal } from './CallModal';

const VOICE_KEY = 'suyat_voice_replies';
const readPref = () => {
  try {
    return window.localStorage.getItem(VOICE_KEY) === '1';
  } catch {
    return false;
  }
};

export function ChatPanel() {
  const { messages, busy, send, clear } = useChat('local');
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [micNote, setMicNote] = useState('');
  const [readAloud, setReadAloud] = useState(readPref);
  const [talkMode, setTalkMode] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const voiceReply = useRef(false);
  const talkRef = useRef(false);
  const readRef = useRef(readAloud);
  const speakToken = useRef(0);
  const micRef = useRef<{ start: () => boolean; stop: () => void } | null>(null);
  talkRef.current = talkMode;
  readRef.current = readAloud;

  const cancelSpeech = () => {
    speakToken.current++; // invalidates any pending "finished speaking" callback
    stopSpeaking();
    setSpeaking(false);
  };

  const submit = async (text: string) => {
    cancelSpeech(); // barge-in: typing or talking over the bot stops it
    const res = await send(text);
    if (!res) return;
    if (!(readRef.current || voiceReply.current || talkRef.current)) return;
    const token = ++speakToken.current;
    setSpeaking(true);
    speak(res.speech, () => {
      if (token !== speakToken.current) return; // cancelled or replaced
      setSpeaking(false);
      if (talkRef.current && res.ok) micRef.current?.start(); // hands-free: listen for the next thing
    });
  };

  const mic = useSpeechInput(
    (t) => {
      voiceReply.current = true;
      void submit(t);
    },
    () => {
      if (talkRef.current) {
        setTalkMode(false);
        setMicNote('I didn’t hear anything, so talk mode is off. Tap Talk mode to start again.');
      }
    },
  );
  micRef.current = mic;

  const setRead = (on: boolean) => {
    setReadAloud(on);
    try {
      window.localStorage.setItem(VOICE_KEY, on ? '1' : '0');
    } catch {
      /* storage blocked: preference just won't persist */
    }
    if (!on) cancelSpeech();
  };

  const toggleTalk = () => {
    setMicNote('');
    if (talkMode) {
      setTalkMode(false);
      mic.stop();
      cancelSpeech();
      return;
    }
    cancelSpeech();
    setTalkMode(true);
    talkRef.current = true;
    voiceReply.current = true;
    if (!mic.start()) {
      setTalkMode(false);
      setMicNote('Voice input isn’t supported in this browser — please type instead.');
    }
  };

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => stopSpeaking(), []);


  const toggleMic = () => {
    setMicNote('');
    cancelSpeech(); // otherwise the mic would hear the bot talking
    setTalkMode(false);
    if (mic.listening) return mic.stop();
    if (!mic.start()) setMicNote('Voice input isn’t supported in this browser — please type instead.');
  };

  return (
    <div className="assistant">
      <div className="assistant-head">
        <p className="muted small" aria-live="polite">
          {mic.listening ? 'Listening… go ahead and talk' : speaking ? 'Speaking…' : busy ? 'Typing…' : 'Virtual assistant · online 24/7'}
        </p>
      </div>

      <div ref={log} className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
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

      <div className="voice-bar" role="group" aria-label="Voice options">
        <button type="button" className="toggle" aria-pressed={readAloud} onClick={() => setRead(!readAloud)}>
          <span aria-hidden>{readAloud ? '🔊' : '🔈'}</span> Read replies aloud
        </button>
        {mic.supported && (
          <button type="button" className="toggle" aria-pressed={talkMode} onClick={toggleTalk}>
            <span aria-hidden>🗣️</span> Talk mode
          </button>
        )}
        {speaking && (
          <button type="button" className="toggle toggle--stop" onClick={cancelSpeech}>
            <span aria-hidden>⏹</span> Stop speaking
          </button>
        )}
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
        <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type or tap the mic, e.g. “I want a cleaning next Monday at 2 PM”" autoComplete="off" maxLength={500} />
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
