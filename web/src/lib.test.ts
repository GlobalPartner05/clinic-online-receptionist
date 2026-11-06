import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './lib';
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
