import { BRANCHES, CLINIC, SERVICES } from '../config/clinic';
import { RemotionClip, type Clip } from './RemotionPlayer';
import { Reveal } from './Reveal';
import { Logo } from './Logo';

export const HERO_CLIP: Clip = {
  id: 'HeroReel',
  width: 1280,
  height: 720,
  poster: '/images/posters/hero.webp',
  alt: `Animated ${CLINIC.name} introduction: ${CLINIC.tagline}.`,
};
export const STEPS_CLIP: Clip = {
  id: 'BookingSteps',
  width: 1080,
  height: 1080,
  poster: '/images/schedule-phone-mockup.webp',
  alt: 'Animation of booking an appointment by sending a message and receiving confirmation.',
};

export function Hero({ onBook }: { onBook: (prompt?: string) => void }) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="pill">🕒 {CLINIC.badge}</span>
          <h1>
            {CLINIC.headlineLead} <span className="accent">{CLINIC.headlineAccent}</span>
          </h1>
          <p className="lead">{CLINIC.heroLead}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onBook()}>
              Book an appointment
            </button>
            <a className="btn btn-ghost" href="#services">
              Our services
            </a>
          </div>
        </div>
        <div className="hero-media">
          <RemotionClip clip={HERO_CLIP} className="player-frame" />
        </div>
      </div>
    </section>
  );
}

export function Services({ onBook }: { onBook: (prompt: string) => void }) {
  return (
    <section id="services" className="section">
      <div className="container">
        <Reveal>
          <h2>Everything for your smile</h2>
          <p className="section-sub">Tap a service to start booking with the receptionist.</p>
        </Reveal>
        <ul className="grid-3 service-grid">
          {SERVICES.map((s, i) => (
            <li key={s.id}>
              <Reveal delay={i * 60}>
                <button className="card service-card" onClick={() => onBook(s.prompt)} aria-label={`${s.title}: ${s.blurb} Start booking`}>
                  <span className="service-num" aria-hidden>
                    0{i + 1}
                  </span>
                  <span className="service-icon" aria-hidden>
                    {s.icon}
                  </span>
                  <strong>{s.title}</strong>
                  <span className="muted">{s.blurb}</span>
                </button>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="section alt">
      <div className="container how-grid">
        <Reveal>
          <RemotionClip clip={STEPS_CLIP} className="player-frame square" />
        </Reveal>
        <Reveal delay={100}>
          <h2>Schedule in just a few easy steps</h2>
          <ol className="steps">
            <li><span>01</span>Find the branch closest to your location.</li>
            <li><span>02</span>Send us a message here with your preferred schedule.</li>
            <li><span>03</span>Wait for your booking confirmation from our team.</li>
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

export function Branches() {
  return (
    <section id="branches" className="section">
      <div className="container">
        <Reveal>
          <h2>Two branches, open after hours by arrangement</h2>
        </Reveal>
        <div className="grid-2">
          {BRANCHES.map((b, i) => (
            <Reveal key={b.id} delay={i * 80}>
              <article className="card branch">
                <h3>{b.name}</h3>
                <p className="muted">{b.address}</p>
                <p>
                  <strong>{b.days}</strong>
                  <br />
                  {b.hours}
                </p>
                <p className="muted small">After-hours appointments by prior arrangement.</p>
                <a className="btn btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.mapQuery)}`}>
                  Get directions ↗
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-row">
        <Logo height={40} />
        <p className="muted small">© {new Date().getFullYear()} {CLINIC.name}. Appointments are confirmed by our team.</p>
      </div>
    </footer>
  );
}
