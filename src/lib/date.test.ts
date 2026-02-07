import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('should return an empty string for unparseable objects', () => {
    const value = 'NaN';

    const result = formatDate(value);

    expect(result).toBe('');
  });

  it('should return a formatted date when supplied with valid date object', () => {
    const value = new Date('2026-02-01');

    const result = formatDate(value);

    expect(result).toBe('1 February 2026');
  });

  it('should return a formatted date when supplied with parseable string', () => {
    const value = '2026-02-01';

    const result = formatDate(value);

    expect(result).toBe('1 February 2026');
  });

  it('should return a formatted date when supplied with UNIX timestamp', () => {
    const value = new Date('2026-02-01').getTime();

    const result = formatDate(value);

    expect(result).toBe('1 February 2026');
  });
});
