import { useEffect, useRef, useState } from 'react';
import { CLINIC } from '../config/clinic';
import { useAssistant } from '../hooks/useAssistant';
import { ChatPanel } from './ChatPanel';

/** The chat, opened by the roaming icon. Mounted on first open and then kept, so the conversation survives closing. */
export function ChatPopup() {
  const { open, setOpen, still, paused, setPaused } = useAssistant();
  const [everOpened, setEverOpened] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setEverOpened(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    // let the panel mount, then put the cursor in the message box
    const t = window.setTimeout(() => document.getElementById('chat-input')?.focus({ preventScroll: true }), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, setOpen]);

  if (!everOpened && !open) return null;
  return (
    <div id="chat-popup" ref={ref} className="chat-pop" role="dialog" aria-label={`Chat with ${CLINIC.assistantName}`} hidden={!open}>
      <div className="chat-pop-head">
        <div>
          <strong>{CLINIC.assistantName}</strong>
          <span className="muted small"> · virtual assistant</span>
        </div>
        <div className="row-gap">
          <button type="button" className="toggle toggle--sm" aria-pressed={paused} onClick={() => setPaused(!paused)} title="Stop the chat icon moving around the page">
            {still && !paused ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion'}
          </button>
          <button type="button" className="icon-btn icon-btn--sm" aria-label="Close chat" onClick={() => setOpen(false)}>
            <span aria-hidden>✕</span>
          </button>
        </div>
      </div>
      <ChatPanel embedded />
    </div>
  );
}
