import { describe, expect, it } from 'vitest';
import { csvCell, formatDateLong, formatTime, isPhMobile, manilaDate, toCsv } from './lib';
import { extractReceiptUrl } from './hooks/useChat';

describe('csv', () => {
  it('quotes and escapes', () => expect(csvCell('a"b')).toBe('"a""b"'));
  it('neutralises formulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe(`"'+1"`);
  });
  it('joins rows', () => expect(toCsv([['a', 1], ['b', null]])).toBe('"a","1"\r\n"b",""'));
});

describe('extractReceiptUrl', () => {
  it('maps legacy links to SPA route', () => {
    expect(extractReceiptUrl('Receipt: /receipt.html?id=abc-123-def')).toBe('/receipt/abc-123-def');
    expect(extractReceiptUrl('x', '/receipt.html?id=abc-123')).toBe('/receipt/abc-123');
  });
  it('returns undefined without a link', () => expect(extractReceiptUrl('hello')).toBeUndefined());
});

describe('booking helpers', () => {
  it('formatTime', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('17:00')).toBe('5:00 PM');
  });
  it('formatDateLong is timezone-proof', () => expect(formatDateLong('2026-11-11')).toBe('Wednesday, Nov 11, 2026'));
  it('manilaDate uses Manila time, not UTC', () => {
    // 2026-11-10 17:00 UTC is already Nov 11 in Manila (UTC+8)
    expect(manilaDate(0, new Date('2026-11-10T17:00:00Z'))).toBe('2026-11-11');
    expect(manilaDate(90, new Date('2026-11-10T17:00:00Z'))).toBe('2027-02-09');
  });
  it('isPhMobile', () => {
    expect(isPhMobile('0917 123 4567')).toBe(true);
    expect(isPhMobile('+63 917 123 4567')).toBe(true);
    expect(isPhMobile('123')).toBe(false);
    expect(isPhMobile('02 8123 4567')).toBe(false);
  });
});
