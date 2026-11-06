import { useCallback, useState } from 'react';
import { Header } from '../components/Header';
import { Branches, Footer, Hero, HowItWorks, Services } from '../components/Sections';
import { ChatPanel, type Pending } from '../components/ChatPanel';
import { Receptionist } from '../components/Receptionist';
import { CLINIC } from '../config/clinic';

export default function Landing() {
  const [pending, setPending] = useState<Pending | null>(null);

  const book = useCallback((prompt?: string) => {
    document.getElementById('assistant')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (prompt) setPending({ text: prompt, nonce: Date.now() });
    else document.getElementById('chat-input')?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Hero onBook={book} />
        <Services onBook={book} />
        <HowItWorks />
        <section id="assistant" className="section">
          <div className="container assistant-wrap">
            <ChatPanel pending={pending} />
          </div>
        </section>
        <Branches />
      </main>
      <button className="fab" onClick={() => book()} aria-label={`Chat with ${CLINIC.receptionistName} to book an appointment`}>
        <Receptionist size={56} ring={false} />
        <span className="fab__label">Need help booking?</span>
      </button>
      <Footer />
    </>
  );
}
