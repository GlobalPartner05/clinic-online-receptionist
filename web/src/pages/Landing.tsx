import { useCallback, useState } from 'react';
import { Header } from '../components/Header';
import { Branches, Footer, Hero, HowItWorks, Services } from '../components/Sections';
import { BookingForm } from '../components/BookingForm';
import { ChatPanel } from '../components/ChatPanel';
import { CLINIC } from '../config/clinic';

const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

export default function Landing() {
  const [preselect, setPreselect] = useState<{ service: string; nonce: number } | null>(null);

  const goBook = useCallback(() => {
    document.getElementById('book')?.scrollIntoView({ behavior: smooth() });
  }, []);
  const pick = useCallback((service: string) => {
    setPreselect({ service, nonce: Date.now() });
    goBook();
  }, [goBook]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Hero onBook={goBook} />
        <Services onPick={pick} />
        <section id="book" className="section book-section">
          <div className="container book-wrap">
            <div className="book-intro">
              <h2>Book your appointment</h2>
              <p className="lead-sm">Choose a service and date, pick an open time, and you are done. You get a booking reference straight away.</p>
              <ul className="check-list">
                <li>Open times shown live for the right branch</li>
                <li>No account or payment needed</li>
                <li>Printable proof of appointment</li>
              </ul>
            </div>
            <BookingForm preselect={preselect} />
          </div>
        </section>
        <HowItWorks />
        <Branches />
        <section id="assistant" className="section alt">
          <div className="container assistant-wrap">
            <h2 className="assistant-title">{CLINIC.assistantTitle}</h2>
            <ChatPanel />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
