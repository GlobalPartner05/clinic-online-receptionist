import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Activity = 'idle' | 'thinking' | 'listening' | 'speaking';

interface AssistantState {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  activity: Activity;
  setActivity: (a: Activity) => void;
  /** User chose to stop the icon moving. */
  paused: boolean;
  setPaused: (v: boolean) => void;
  /** True when the icon must hold still: the user paused it, or their system asks for reduced motion. */
  still: boolean;
}

const Ctx = createContext<AssistantState | null>(null);
const KEY = 'suyat_mascot_paused';

function readPaused(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<Activity>('idle');
  const [paused, setPausedState] = useState(readPaused);
  const reduced = useReducedMotion();

  const setPaused = useCallback((v: boolean) => {
    setPausedState(v);
    try {
      window.localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* storage blocked: the choice just won't persist */
    }
  }, []);

  const value = useMemo<AssistantState>(
    () => ({ open, setOpen, toggle: () => setOpen((o) => !o), activity, setActivity, paused, setPaused, still: paused || reduced }),
    [open, activity, paused, reduced, setPaused],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistant(): AssistantState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAssistant must be used inside <AssistantProvider>');
  return v;
}
