import { test, expect } from 'vitest';
import { makeMockDb } from './mockdb';

test('lists open clinic hours for a date', async () => {
  const { checkAvailableSlots } = await import('../src/tools');
  const slots = await checkAvailableSlots(makeMockDb() as never, '2026-10-20');
  expect(slots).toContain('09:00');
  expect(slots).toContain('17:00');
});

test('rejects double-booking same slot', async () => {
  const { bookAppointment } = await import('../src/tools');
  const db = makeMockDb() as never;
  await bookAppointment(db, {
    patientName: 'Ana',
    patientPhone: '09170000001',
    serviceType: 'cleaning',
    date: '2026-10-20',
    time: '10:00',
  });
  await expect(
    bookAppointment(db, {
      patientName: 'Ben',
      patientPhone: '09170000002',
      serviceType: 'cleaning',
      date: '2026-10-20',
      time: '10:00',
    }),
  ).rejects.toThrow('SLOT_TAKEN');
});

test('rejects invalid date and time', async () => {
  const { bookAppointment } = await import('../src/tools');
  const db = makeMockDb() as never;
  await expect(
    bookAppointment(db, {
      patientName: 'Ana',
      patientPhone: '09170000001',
      serviceType: 'cleaning',
      date: '2026-13-40',
      time: '10:00',
    }),
  ).rejects.toThrow();
  await expect(
    bookAppointment(db, {
      patientName: 'Ana',
      patientPhone: '09170000001',
      serviceType: 'cleaning',
      date: '2026-10-20',
      time: '25:99',
    }),
  ).rejects.toThrow();
});

test('rejects booking outside clinic hours', async () => {
  const { bookAppointment } = await import('../src/tools');
  const db = makeMockDb() as never;
  await expect(
    bookAppointment(db, {
      patientName: 'Ana',
      patientPhone: '09170000001',
      serviceType: 'cleaning',
      date: '2026-10-20',
      time: '03:00',
    }),
  ).rejects.toThrow('INVALID_TIME');
});

test('rejects booking on Sunday (clinic closed)', async () => {
  const { bookAppointment } = await import('../src/tools');
  // 2026-10-25 is a Sunday
  await expect(
    bookAppointment(makeMockDb() as never, {
      patientName: 'Ana',
      patientPhone: '09170000001',
      serviceType: 'cleaning',
      date: '2026-10-25',
      time: '10:00',
    }),
  ).rejects.toThrow('INVALID_TIME');
});

test('rejects Saturday booking after 13:00 but allows morning', async () => {
  const { bookAppointment } = await import('../src/tools');
  // 2026-10-24 is a Saturday
  await expect(
    bookAppointment(makeMockDb() as never, {
      patientName: 'Ana',
      patientPhone: '09170000001',
      serviceType: 'cleaning',
      date: '2026-10-24',
      time: '14:00',
    }),
  ).rejects.toThrow('INVALID_TIME');
  await expect(
    bookAppointment(makeMockDb() as never, {
      patientName: 'Ana',
      patientPhone: '09170000001',
      serviceType: 'cleaning',
      date: '2026-10-24',
      time: '10:00',
    }),
  ).resolves.toHaveProperty('id');
});

test('slots reflect day-of-week hours', async () => {
  const { checkAvailableSlots } = await import('../src/tools');
  const db = makeMockDb() as never;
  // Sunday: closed entirely
  await expect(checkAvailableSlots(db, '2026-10-25')).resolves.toEqual([]);
  // Saturday: only up to 13:00
  const sat = await checkAvailableSlots(db, '2026-10-24');
  expect(sat).toContain('09:00');
  expect(sat).toContain('13:00');
  expect(sat).not.toContain('14:00');
});

test('cancel frees the slot for re-booking', async () => {
  const { bookAppointment, cancelAppointment } = await import('../src/tools');
  const db = makeMockDb() as never;
  await bookAppointment(db, {
    patientName: 'Ana',
    patientPhone: '09170000001',
    serviceType: 'cleaning',
    date: '2026-10-21',
    time: '11:00',
  });
  const { cancelled } = await cancelAppointment(db, {
    patientPhone: '09170000001',
    date: '2026-10-21',
  });
  expect(cancelled).toBe(1);
  await bookAppointment(db, {
    patientName: 'Ben',
    patientPhone: '09170000002',
    serviceType: 'cleaning',
    date: '2026-10-21',
    time: '11:00',
  });
});
