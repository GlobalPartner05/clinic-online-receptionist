export const CLINIC_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export interface AppointmentRow {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reminder_sent: number;
  created_at: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function assertValidDate(date: string): void {
  if (!DATE_RE.test(date)) throw new Error(`INVALID_DATE: ${date}`);
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new Error(`INVALID_DATE: ${date}`);
  }
}

export function assertValidTime(time: string): void {
  if (!TIME_RE.test(time)) throw new Error(`INVALID_TIME: ${time}`);
}

// Clinic hours per the spec: Mon-Fri 09:00-17:00, Sat 09:00-13:00, Sun closed.
export function clinicHoursFor(date: string): string[] {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (day === 0) return [];
  if (day === 6) return CLINIC_HOURS.filter((t) => t <= '13:00');
  return CLINIC_HOURS;
}

export function withinClinicHours(date: string, time: string): boolean {
  return clinicHoursFor(date).includes(time);
}

export async function fetchConfirmedTimes(
  db: D1Database,
  date: string,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      "SELECT appointment_time FROM appointments WHERE appointment_date = ? AND status = 'confirmed'",
    )
    .bind(date)
    .all<{ appointment_time: string }>();
  return results.map((r) => r.appointment_time);
}
