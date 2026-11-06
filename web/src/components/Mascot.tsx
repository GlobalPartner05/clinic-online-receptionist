import { useEffect, useRef, useState } from 'react';
import { CLINIC } from '../config/clinic';
import { useAssistant } from '../hooks/useAssistant';
import { mascotSpot, type Spot } from '../lib';

/** Where the icon rests while each part of the page is on screen. Order = page order. */
const JOURNEY: { selector: string; spot: Spot }[] = [
  { selector: '.hero', spot: 'br' },
  { selector: '#services', spot: 'ml' },
  { selector: '#book', spot: 'mr' },
  { selector: '#how', spot: 'ml' },
  { selector: '#branches', spot: 'mr' },
];
const TRAVEL_MS = 1300;
const HINT_KEY = 'suyat_mascot_hint';

const sizeFor = (vw: number) => (vw < 640 ? 60 : 76);

/** Which part of the page is under the reading line (40% down the viewport). */
function activeSpot(): Spot {
  const line = window.innerHeight * 0.4;
  let current: Spot = JOURNEY[0].spot;
  for (const j of JOURNEY) {
    const el = document.querySelector(j.selector);
    if (el && el.getBoundingClientRect().top <= line) current = j.spot;
  }
  return current;
}

export function Mascot() {
  const { open, toggle, activity, still } = useAssistant();
  const [pos, setPos] = useState<{ x: number; y: number }>(() => mascotSpot('br', window.innerWidth, window.innerHeight, sizeFor(window.innerWidth)));
  const [hopping, setHopping] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [wander, setWander] = useState({ x: 0, y: 0 });
  const [hint, setHint] = useState(false);
  const spot = useRef<Spot>('br');
  const lastX = useRef(pos.x);
  const hopTimer = useRef<number | undefined>(undefined);
  const btn = useRef<HTMLButtonElement>(null);

  // Travel between sections as the visitor scrolls.
  useEffect(() => {
    const place = (animate: boolean) => {
      const size = sizeFor(window.innerWidth);
      const target = still || open ? 'br' : activeSpot();
      const next = mascotSpot(target, window.innerWidth, window.innerHeight, size);
      const moved = target !== spot.current || Math.abs(next.x - lastX.current) > 4;
      setTilt(Math.max(-14, Math.min(14, (next.x - lastX.current) / 40)));
      spot.current = target;
      lastX.current = next.x;
      setPos(next);
      if (animate && moved && !still && !open) {
        setHopping(true);
        window.clearTimeout(hopTimer.current);
        hopTimer.current = window.setTimeout(() => setHopping(false), TRAVEL_MS);
      }
    };
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => place(true));
    };
    place(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hopTimer.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [still, open]);

  // Idle: now and then drift a little and wiggle, so it feels alive without leaving its area.
  useEffect(() => {
    if (still || open) {
      setWander({ x: 0, y: 0 });
      return;
    }
    const id = window.setInterval(() => {
      setWander({ x: Math.round((Math.random() - 0.5) * 56), y: Math.round((Math.random() - 0.5) * 40) });
    }, 4500);
    return () => window.clearInterval(id);
  }, [still, open]);

  // One friendly greeting per visit.
  useEffect(() => {
    if (still || open) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(HINT_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;
    const show = window.setTimeout(() => setHint(true), 2500);
    const hide = window.setTimeout(() => {
      setHint(false);
      try {
        window.sessionStorage.setItem(HINT_KEY, '1');
      } catch {
        /* ignore */
      }
    }, 10000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [still, open]);

  // Return focus to the icon when the chat closes.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) btn.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const size = sizeFor(typeof window === 'undefined' ? 1280 : window.innerWidth);
  const onRight = pos.x > (typeof window === 'undefined' ? 640 : window.innerWidth / 2);

  return (
    <div
      className={`mascot ${still ? 'is-still' : ''} ${open ? 'is-open' : ''}`}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, width: size, height: size }}
    >
      <div className="mascot-drift" style={{ transform: `translate3d(${wander.x}px, ${wander.y}px, 0)` }}>
        {hint && !open && (
          <p className={`mascot-hint ${onRight ? 'to-left' : 'to-right'}`} role="status">
            {CLINIC.assistantHint}
          </p>
        )}
        <button
          ref={btn}
          type="button"
          className={`mascot-btn mascot-btn--${activity} ${hopping ? 'is-hopping' : ''}`}
          style={{ ['--tilt' as string]: `${tilt}deg`, width: size, height: size }}
          aria-label={open ? `Close chat with ${CLINIC.assistantName}` : `Chat with ${CLINIC.assistantName}`}
          aria-expanded={open}
          aria-controls="chat-popup"
          onClick={() => {
            setHint(false);
            toggle();
          }}
        >
          <img src={CLINIC.assistantIcon} srcSet={`${CLINIC.assistantIconSmall} 112w, ${CLINIC.assistantIcon} 384w`} sizes={`${size}px`} alt="" width={size} height={size} draggable={false} />
        </button>
      </div>
    </div>
  );
}
