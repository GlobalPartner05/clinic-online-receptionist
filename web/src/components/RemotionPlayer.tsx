import { Suspense, lazy, useEffect, useRef, useState } from 'react';

const PlayerImpl = lazy(() => import('./PlayerImpl'));

export interface Clip {
  id: 'HeroReel' | 'ServicesShowcase' | 'BookingSteps' | 'ReceptionistWave';
  width: number;
  height: number;
  poster: string;
  alt: string;
  inputProps?: Record<string, unknown>;
}

function usePrefersReducedMotion() {
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

/** Lazy-mounts the Remotion Player only when visible; shows a static poster under reduced motion. */
export function RemotionClip({ clip, className }: { clip: Clip; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ aspectRatio: `${clip.width} / ${clip.height}` }} role="img" aria-label={clip.alt}>
      {reduced || !visible ? (
        <img src={clip.poster} alt="" width={clip.width} height={clip.height} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
      ) : (
        <Suspense fallback={<img src={clip.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}>
          <PlayerImpl clip={clip} />
        </Suspense>
      )}
    </div>
  );
}
