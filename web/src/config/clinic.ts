/**
 * PERSONALISATION POINT 1 of 3 — everything a visitor reads about the clinic.
 * To brand the site for a new client, edit this file, `tokens.css` (colours) and `index.html` (page title/meta).
 * See docs/NEW-CLIENT.md for the full checklist (including the few backend strings).
 */
export const CLINIC = {
  name: 'Suyat Dental Clinic',
  shortName: 'Suyat',
  wordmark: 'Suyat',               // script wordmark in the Logo component
  descriptor: 'DENTAL CLINIC',     // small caps line under the wordmark
  domain: 'suyatdental.com',
  tagline: 'Comprehensive Dental Care for a Healthier, Brighter Smile',
  badge: 'After-Hours Appointments Available',
  headlineLead: 'Comprehensive',
  headlineAccent: 'Dental Care',
  heroSubhead: 'for a Healthier, Brighter Smile',
  heroLead: 'for a healthier, brighter smile — book in minutes with our 24/7 AI receptionist.',
  welcome:
    'Mabuhay! I’m the Suyat Dental virtual receptionist. I can check slots, book, reschedule or cancel — anytime. How can I help?',
  sessionKey: 'suyat_session_id',  // localStorage key for the chat session
  csvPrefix: 'suyat',              // admin CSV export file name prefix
} as const;

export interface Service {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  /** Message sent to the receptionist; uses wording the chat parser understands. */
  prompt: string;
}

export const SERVICES: Service[] = [
  { id: 'cleaning', title: 'Cleaning & checkups', blurb: 'Routine examinations and preventive dental care.', icon: '🦷', prompt: 'I want to book a cleaning' },
  { id: 'restorations', title: 'Restorations', blurb: 'Discuss fillings and other restorative treatment options.', icon: '👑', prompt: 'I want to book a filling' },
  { id: 'braces', title: 'Braces & consultations', blurb: 'Explore orthodontic care and consultation options.', icon: '📐', prompt: 'I want to book a braces consultation' },
  { id: 'whitening', title: 'Teeth whitening', blurb: 'Ask the dental team about whitening options.', icon: '✨', prompt: 'I want to book teeth whitening' },
  { id: 'extractions', title: 'Extractions', blurb: 'Consult the clinic about extraction and surgical care.', icon: '🩺', prompt: 'I want to book an extraction' },
  { id: 'concerns', title: 'Dental concerns', blurb: 'Contact the clinic directly for urgent dental needs.', icon: '🚨', prompt: 'I have a toothache and need an urgent appointment' },
];

export const STEPS = [
  { n: '01', text: 'Find the branch closest to your location.' },
  { n: '02', text: 'Send us a message here with your preferred schedule.' },
  { n: '03', text: 'Wait for your booking confirmation from our team.' },
] as const;

export interface Branch {
  id: string;
  name: string;
  address: string;
  days: string;
  hours: string;
  mapQuery: string;
}

export const BRANCHES: Branch[] = [
  {
    id: 'san-nicolas',
    name: 'San Nicolas, Pangasinan',
    address: 'Sta. Maria West, San Nicolas, Pangasinan',
    days: 'Monday – Tuesday',
    hours: '9:00 AM – 6:00 PM',
    mapQuery: 'Sta. Maria West, San Nicolas, Pangasinan',
  },
  {
    id: 'project-6',
    name: 'Project 6, Quezon City',
    address: '111 – B2 Rd 3 Cor. Road 7, Project 6, Quezon City',
    days: 'Wednesday – Saturday',
    hours: '10:00 AM – 6:00 PM',
    mapQuery: '111 B2 Road 3 corner Road 7, Project 6, Quezon City',
  },
];

export const QUICK_CHIPS = [
  'Check available slots tomorrow',
  'I want to book a cleaning',
  'What are your clinic hours?',
] as const;
