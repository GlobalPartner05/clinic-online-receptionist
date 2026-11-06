import {
  bookAppointment,
  cancelAppointment,
  checkAvailableSlots,
  queryAppointments,
  rescheduleAppointment,
  getAppointmentReceipt,
  generateClinicReport,
} from './tools.js';
import { assertValidDate } from './db.js';

const SERVICES = [
  'root canal',
  'cleaning',
  'extraction',
  'filling',
  'braces',
  'checkup',
  'whitening',
  'denture',
  'consultation',
];

function manilaDatePlus(days: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const base = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
  );
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

function extractDate(text: string): string | null {
  const m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) {
    try {
      assertValidDate(m[0]);
      return m[0];
    } catch {
      return null;
    }
  }
  if (/\btomorrow\b/i.test(text)) return manilaDatePlus(1);
  if (/\btoday\b/i.test(text)) return manilaDatePlus(0);
  return null;
}

function extractAllDates(text: string): string[] {
  const matches = [...text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)].map(
    (m) => m[0],
  );
  const valid = matches.filter((d) => {
    try {
      assertValidDate(d);
      return true;
    } catch {
      return false;
    }
  });
  if (valid.length === 0) {
    const single = extractDate(text);
    return single ? [single] : [];
  }
  return valid;
}

function extractTime(text: string): string | null {
  const m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function extractPhone(text: string): string | null {
  const scrubbed = text
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, ' ');
  const m = scrubbed.match(/\+?\d[\d\s-]{6,14}\d/);
  return m ? m[0].replace(/[\s-]/g, '') : null;
}

function extractName(text: string): string | null {
  const m = text.match(/name\s*[:\-]?\s*([A-Za-z][A-Za-z .'-]{1,40})/i);
  if (!m) return null;
  return m[1].split(',')[0].replace(/\d+.*$/, '').trim() || null;
}

function extractEmail(text: string): string | null {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return m ? m[0] : null;
}

function extractService(text: string): string | null {
  const lower = text.toLowerCase();
  return SERVICES.find((s) => lower.includes(s)) ?? null;
}

export interface BookedSummary {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  receipt_url?: string;
  reference_number?: string;
}

export interface ChatResult {
  reply: string;
  booked?: BookedSummary;
}

export async function handleChatMessage(
  db: D1Database,
  message: string,
): Promise<ChatResult> {
  const text = message.trim();
  const lower = text.toLowerCase();
  const phone = extractPhone(text);
  const time = extractTime(text);
  const dates = extractAllDates(text);

  // 1. Reschedule intent
  if (/reschedule|move appointment|change appointment|re-schedule/.test(lower)) {
    if (!phone) {
      return {
        reply:
          'To reschedule, please provide your phone number, current appointment date, new date, and new time. ' +
          'Example: "Reschedule 09170000001 from 2026-10-20 to 2026-10-22 at 14:00".',
      };
    }

    let oldDate: string | null = null;
    let newDate: string | null = null;

    if (dates.length >= 2) {
      oldDate = dates[0];
      newDate = dates[1];
    } else if (dates.length === 1) {
      // Find user's confirmed appointment
      const userAppts = await queryAppointments(db, { patientPhone: phone });
      const active = userAppts.find((a) => a.status === 'confirmed');
      if (active) {
        oldDate = active.appointment_date;
        newDate = dates[0];
      } else {
        oldDate = dates[0];
      }
    }

    if (!oldDate || !newDate || !time) {
      return {
        reply:
          'Please specify both your current appointment date, the new desired date (YYYY-MM-DD), and time (HH:MM). ' +
          'Example: "Reschedule 09170000001 from 2026-10-20 to 2026-10-22 at 14:00".',
      };
    }

    try {
      const res = await rescheduleAppointment(db, {
        patientPhone: phone,
        oldDate,
        newDate,
        newTime: time,
      });
      return {
        reply:
          `Your appointment has been successfully rescheduled to ${res.appointment.appointmentDate} at ${res.appointment.appointmentTime} at our ${res.appointment.branch}. ` +
          `Ref: ${res.appointment.referenceNumber}. View your updated proof of appointment: ${res.appointment.receiptUrl}`,
      };
    } catch (err) {
      if (err instanceof Error && err.message === 'APPOINTMENT_NOT_FOUND') {
        return {
          reply: `I couldn't find a confirmed appointment for ${phone} on ${oldDate}. Please check your phone number and date.`,
        };
      }
      if (err instanceof Error && err.message === 'SLOT_TAKEN') {
        const alt = await checkAvailableSlots(db, newDate);
        return {
          reply:
            `Sorry, ${newDate} at ${time} is already booked.` +
            (alt.length > 0 ? ` Other open slots: ${alt.slice(0, 4).join(', ')}.` : ''),
        };
      }
      return {
        reply: 'Sorry, we could not reschedule that slot. Please check clinic hours (09:00-17:00 Mon-Fri, 09:00-13:00 Sat).',
      };
    }
  }

  // 2. Receipt / Proof of Appointment intent
  if (/receipt|proof|ticket|slip|confirmation card/.test(lower)) {
    if (!phone) {
      return {
        reply:
          'To retrieve your official appointment receipt or proof of booking, please provide your registered phone number. Example: "Send receipt for 09170000001".',
      };
    }
    const appts = await queryAppointments(db, { patientPhone: phone });
    const target = appts.find((a) => a.status === 'confirmed') || appts[0];
    if (!target) {
      return {
        reply: `No appointments found on file for phone ${phone}. You can book a new appointment anytime!`,
      };
    }
    const receipt = await getAppointmentReceipt(db, target.id);
    if (!receipt) {
      return { reply: 'Could not generate receipt at this time.' };
    }
    return {
      reply:
        `📄 **Official Proof of Appointment**\n` +
        `• Ref: ${receipt.referenceNumber}\n` +
        `• Patient: ${receipt.patientName}\n` +
        `• Service: ${receipt.serviceType}\n` +
        `• Date & Time: ${receipt.appointmentDate} at ${receipt.appointmentTime}\n` +
        `• Branch: ${receipt.branch} (${receipt.branchAddress})\n` +
        `• Status: ${receipt.status.toUpperCase()}\n` +
        `View & print digital receipt: ${receipt.receiptUrl}`,
    };
  }

  // 3. Status check / appointment query
  if (/status|my appointment|check appointment|existing booking|do i have/.test(lower)) {
    if (!phone) {
      return {
        reply:
          'Please send your registered phone number to check your appointment status. Example: "Check appointment 09170000001".',
      };
    }
    const appts = await queryAppointments(db, { patientPhone: phone });
    if (appts.length === 0) {
      return {
        reply: `No appointments found for ${phone}. Reply with "What slots are open tomorrow?" to book a visit.`,
      };
    }
    const list = appts
      .map(
        (a) =>
          `• ${a.appointment_date} at ${a.appointment_time} (${a.service_type}) — Status: ${a.status} [Receipt: /receipt.html?id=${a.id}]`,
      )
      .join('\n');
    return {
      reply: `Here are your appointment records for ${phone}:\n${list}`,
    };
  }

  // 4. Reports / Clinic analytics intent
  if (/\b(report|clinic stats|analytics summary|daily digest)\b/.test(lower)) {
    const targetDate = dates[0];
    const rep = await generateClinicReport(db, targetDate ? { date: targetDate } : {});
    const breakdown = Object.entries(rep.servicesBreakdown)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    return {
      reply:
        `📊 **Clinic Appointment Report (${rep.date})**\n` +
        `• Total Bookings: ${rep.totalBookings}\n` +
        `• Confirmed: ${rep.confirmed} | Completed: ${rep.completed} | Cancelled: ${rep.cancelled}\n` +
        `• Services: ${breakdown || 'None yet'}\n` +
        `Open admin portal at /admin.html for full records.`,
    };
  }

  // 5. Cancellation
  if (/\bcancel\b/.test(lower)) {
    const singleDate = dates[0] || extractDate(text);
    if (!phone || !singleDate) {
      return {
        reply:
          'To cancel, please send your phone number and appointment date (YYYY-MM-DD). Example: Cancel 09170000001 on 2026-10-20.',
      };
    }
    const { cancelled } = await cancelAppointment(db, {
      patientPhone: phone,
      date: singleDate,
    });
    return {
      reply:
        cancelled > 0
          ? `Done — your appointment on ${singleDate} is cancelled. The slot is now open if you want to rebook.`
          : `I couldn't find a confirmed appointment for ${phone} on ${singleDate}. Please check the details and try again.`,
    };
  }

  const singleDate = dates[0] || extractDate(text);

  // 6. Slots check
  if (/avail|slot|open|schedule|free/.test(lower) && !time) {
    if (!singleDate) {
      return {
        reply:
          'Which date should I check? Please send a date like 2026-10-20 or say tomorrow.',
      };
    }
    const slots = await checkAvailableSlots(db, singleDate);
    return {
      reply:
        slots.length > 0
          ? `Open slots on ${singleDate}: ${slots.join(', ')}. Reply with a time plus your name and phone to book.`
          : `Sorry, ${singleDate} is fully booked. Please try another date.`,
    };
  }

  // 7. Booking
  if (/book|reserve|appointment|schedule/.test(lower) || (time && phone)) {
    const name = extractName(text);
    const email = extractEmail(text);
    const service = extractService(text) ?? 'general consultation';
    const missing: string[] = [];
    if (!name) missing.push('your name (e.g. name Ana)');
    if (!phone) missing.push('your phone number');
    if (!singleDate) missing.push('a date (YYYY-MM-DD or tomorrow)');
    if (!time) missing.push('a time (HH:MM, clinic hours 09:00-17:00)');
    if (missing.length > 0) {
      return { reply: `Almost there — I still need ${missing.join(', ')}.` };
    }
    try {
      const { id, receiptUrl, referenceNumber } = await bookAppointment(db, {
        patientName: name!,
        patientPhone: phone!,
        patientEmail: email ?? undefined,
        serviceType: service,
        date: singleDate!,
        time: time!,
      });
      const booked: BookedSummary = {
        id,
        patient_name: name!,
        patient_phone: phone!,
        patient_email: email,
        service_type: service,
        appointment_date: singleDate!,
        appointment_time: time!,
        receipt_url: receiptUrl,
        reference_number: referenceNumber,
      };
      return {
        reply:
          `You're booked, ${name}! ${service} on ${singleDate} at ${time}. ` +
          `Booking Ref: ${referenceNumber}. ` +
          `Proof of appointment & digital receipt: ${receiptUrl}. ` +
          `We'll also send reminders before your visit!`,
        booked,
      };
    } catch (err) {
      if (err instanceof Error && err.message === 'SLOT_TAKEN') {
        const alternatives = (await checkAvailableSlots(db, singleDate!))
          .filter((t) => t !== time)
          .slice(0, 4);
        return {
          reply:
            `Sorry, ${singleDate} at ${time} is already taken.` +
            (alternatives.length > 0
              ? ` Other open slots: ${alternatives.join(', ')}.`
              : ' Please try another date.'),
        };
      }
      if (err instanceof Error && err.message.startsWith('INVALID_')) {
        return {
          reply:
            'That date or time looks invalid. Clinic hours are 09:00-17:00 (Sat 09:00-13:00, Sun closed); please send a valid date (YYYY-MM-DD) and time (HH:MM).',
        };
      }
      throw err;
    }
  }

  return {
    reply:
      'Mabuhay! I am the Suyat Dental Clinic 24/7 AI Receptionist. I can:\n' +
      '• Check available slots ("What slots are open tomorrow?")\n' +
      '• Book appointments ("Book cleaning tomorrow 10:00, name Ana 09170000001")\n' +
      '• Reschedule visits ("Reschedule 09170000001 to 2026-10-22 at 14:00")\n' +
      '• Deliver official proof of appointment ("Send receipt for 09170000001")\n' +
      '• Check booking status or cancel an appointment\n' +
      '• Answer phone calls & deliver SMS reminders',
  };
}

